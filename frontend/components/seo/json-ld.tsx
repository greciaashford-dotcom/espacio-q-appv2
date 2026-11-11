import React from "react";

export function JsonLd({ data, id }: { data: Record<string, unknown>; id: string }) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
