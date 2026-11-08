import { describe, expect, it } from "vitest";
import {
  detectImageMimeFromBuffer,
  isPrivateOrReservedIp,
  validateExternalImageUrl,
} from "@/lib/security/ssrf";

describe("Seguridad anti-SSRF y validación de imágenes por magic bytes", () => {
  it("detecta correctamente IPs privadas, loopback, link-local, metadatos cloud e IPv6 internas", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.15")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.5.4")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.20")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
    expect(isPrivateOrReservedIp("fc00::1234")).toBe(true);
    expect(isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("::ffff:169.254.169.254")).toBe(true);

    // IP pública legítima
    expect(isPrivateOrReservedIp("151.101.1.140")).toBe(false);
  });

  it("bloquea esquemas HTTP, puertos no estándar, credenciales, localhost, IPs directas y dominios no autorizados", async () => {
    const httpRes = await validateExternalImageUrl(
      "http://images.unsplash.com/photo-123",
      { skipDnsLookup: true }
    );
    expect(httpRes.ok).toBe(false);

    const credRes = await validateExternalImageUrl(
      "https://admin:secret@images.unsplash.com/photo-123",
      { skipDnsLookup: true }
    );
    expect(credRes.ok).toBe(false);

    const portRes = await validateExternalImageUrl(
      "https://images.unsplash.com:8443/photo-123",
      { skipDnsLookup: true }
    );
    expect(portRes.ok).toBe(false);

    const localRes = await validateExternalImageUrl(
      "https://localhost/internal.png",
      { skipDnsLookup: true }
    );
    expect(localRes.ok).toBe(false);

    const metaRes = await validateExternalImageUrl(
      "https://169.254.169.254/latest/meta-data/",
      { skipDnsLookup: true }
    );
    expect(metaRes.ok).toBe(false);

    const driveRes = await validateExternalImageUrl(
      "https://drive.google.com/file/d/abc123/view",
      { skipDnsLookup: true }
    );
    expect(driveRes.ok).toBe(false);

    const unallowedDomain = await validateExternalImageUrl(
      "https://attacker.example.org/payload.jpg",
      { skipDnsLookup: true, customAllowedDomains: ["images.unsplash.com"] }
    );
    expect(unallowedDomain.ok).toBe(false);
  });

  it("permite URLs HTTPS válidas dentro de la lista blanca de dominios", async () => {
    const valid = await validateExternalImageUrl(
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
      { skipDnsLookup: true, customAllowedDomains: ["images.unsplash.com"] }
    );
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.hostname).toBe("images.unsplash.com");
    }
  });

  it("verifica magic bytes reales y rechaza SVG u otros archivos renombrados", () => {
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    expect(detectImageMimeFromBuffer(jpegHeader)).toBe("image/jpeg");

    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(detectImageMimeFromBuffer(pngHeader)).toBe("image/png");

    const svgAttack = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      "utf8"
    );
    expect(detectImageMimeFromBuffer(svgAttack)).toBeNull();
  });
});
