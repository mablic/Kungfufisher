// One analytic fog pass replaces per-frame path boolean ops and three large blurs.
// Squared distances keep the soft edges without a square root per light per pixel.
export const FOG_LIGHTS = 12;
export const FOG_SHADER = `
uniform float4 tint;
uniform float strength;
uniform float surface;
uniform float3 lights[12];
half4 main(float2 p) {
  float veil = smoothstep(surface, surface + 36.0, p.y);
  for (int i=0; i<12; i++) {
    if (lights[i].x < -9000.0) break;
    float2 delta = p - lights[i].xy;
    float inner = max(0.0, lights[i].z - 22.0);
    float outer = lights[i].z + 22.0;
    veil = min(veil, smoothstep(inner * inner, outer * outer, dot(delta, delta)));
  }
  float alpha = clamp(veil * strength, 0.0, 1.0);
  return half4(tint.rgb * alpha, alpha);
}`;
