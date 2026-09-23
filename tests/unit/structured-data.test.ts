import { describe, expect, it } from 'vitest';

import { serializeJsonLd, trackingApplicationJsonLd } from '@/lib/structured-data';

describe('tracking WebApplication JSON-LD', () => {
  it('uses the Schema.org WebApplication type', () => {
    expect(trackingApplicationJsonLd['@context']).toBe('https://schema.org');
    expect(trackingApplicationJsonLd['@type']).toBe('WebApplication');
    expect(trackingApplicationJsonLd.applicationCategory).toBe('BusinessApplication');
  });

  it('escapes opening angle brackets before embedding JSON in HTML', () => {
    expect(serializeJsonLd({ value: '</script>' })).toContain('\\u003c/script>');
  });
});
