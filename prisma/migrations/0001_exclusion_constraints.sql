-- Extensión requerida en PostgreSQL para combinar igualdad escalar (=) e intersección de rangos (&&) en GIST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Restricción de exclusión temporal anti-solapamiento en Occupancy por profesional
-- Garantiza a nivel de motor PostgreSQL que ningún profesional tenga dos intervalos activos que se solapen en [startAtUtc, endAtUtc)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'occupancy_no_overlap_gist'
  ) THEN
    ALTER TABLE "Occupancy"
      ADD CONSTRAINT occupancy_no_overlap_gist
      EXCLUDE USING gist (
        "professionalId" WITH =,
        tsrange("startAtUtc", "endAtUtc", '[)') WITH &&
      )
      WHERE ("active" = true);
  END IF;
END
$$;

-- Restricción de exclusión temporal anti-solapamiento en ResourceReservation por recurso compartido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resource_reservation_no_overlap_gist'
  ) THEN
    ALTER TABLE "ResourceReservation"
      ADD CONSTRAINT resource_reservation_no_overlap_gist
      EXCLUDE USING gist (
        "resourceKey" WITH =,
        tsrange("startAtUtc", "endAtUtc", '[)') WITH &&
      )
      WHERE ("active" = true);
  END IF;
END
$$;

-- Verificación de coherencia temporal: startAtUtc < endAtUtc
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'occupancy_valid_range_chk'
  ) THEN
    ALTER TABLE "Occupancy"
      ADD CONSTRAINT occupancy_valid_range_chk
      CHECK ("startAtUtc" < "endAtUtc");
  END IF;
END
$$;
