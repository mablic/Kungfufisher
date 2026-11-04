import { PaintStyle, Skia, matchFont, type SkImage } from "@shopify/react-native-skia";
import { MANUAL_EMBLEMS, MANUAL_STITCHES, MANUAL_WEAVE } from "./renderAssets";
import { SKILLS, SKILL_COLOR } from "./skills";

// Eight immutable 3x sprites: less than 1.3 MiB of RGBA pixels in total.
// CPU rasterization happens once, outside the simulation and frame worklets.
let cached: (SkImage | null)[] | undefined;
export function manualArtwork() {
  if (cached) return cached;
  const font = matchFont({ fontFamily: "Helvetica", fontSize: 6.5, fontWeight: "700" });
  cached = SKILLS.map((skill, index) => {
    const surface = Skia.Surface.Make(192, 216);
    if (!surface) return null;
    const c = surface.getCanvas(), p = Skia.Paint();
    p.setAntiAlias(true);
    c.clear(Skia.Color("transparent"));
    c.scale(3, 3); c.translate(32, 30);
    const paint = (color: string, stroke = 0, alpha = 1) => {
      p.setColor(Skia.Color(color)); p.setAlphaf(alpha);
      p.setStyle(stroke ? PaintStyle.Stroke : PaintStyle.Fill);
      p.setStrokeWidth(stroke);
      return p;
    };
    // Bake the translucent water contact, paper, cloth and lettering together.
    c.drawOval(Skia.XYWHRect(-27, 17, 54, 12), paint("#092D35", 0, .3));
    c.drawOval(Skia.XYWHRect(-29, 15, 58, 13), paint("#C7E4DA", .65, .38));
    c.save(); c.rotate(-5.73, 0, 0);
    const rect = (x: number, y: number, w: number, h: number, color: string, stroke = 0, alpha = 1) =>
      c.drawRect(Skia.XYWHRect(x, y, w, h), paint(color, stroke, alpha));
    rect(-18,-22,38,47,"#101F29",0,.35);
    rect(-17,-21,35,44,"#E4D2A7");
    rect(-15,20,32,.7,"#AE9569"); rect(-15,22,32,.7,"#AE9569");
    rect(-19,-23,36,42,"#243D46");
    c.drawPath(MANUAL_WEAVE, paint("#87918A",.45,.22));
    rect(-11,-21,26,38,"#B7AA7F",.5,.65);
    rect(-19,-23,6,42,"#142A3B");
    c.drawPath(MANUAL_STITCHES, paint("#DFCCA2",1));
    rect(6,-19,7,18,"#E4D2A5");
    for (const y of [-15,-11,-7]) rect(8,y,3,1,"#5C5845");
    rect(-8,-5,19,19,"#132C35");
    rect(-8,-5,19,19,SKILL_COLOR[skill],.7,.7);
    c.save(); c.translate(0, 4); c.scale(1.3, 1.3); c.translate(0, -4);
    c.drawPath(MANUAL_EMBLEMS[index],paint(SKILL_COLOR[skill],1.4)); c.restore();
    rect(9,13,5,4,"#AD493C");
    c.restore();
    c.drawText("3 CASTS",-16,36,paint("#F4DEAC"),font);
    const image = surface.makeImageSnapshot();
    surface.dispose(); p.dispose();
    return image;
  });
  return cached;
}
