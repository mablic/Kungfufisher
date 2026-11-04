export const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;
export const IOS_STORE_URL = 'https://apps.apple.com/app/id6825627684';
export const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mablic.kungfufisher';
export function newerVersion(candidate: unknown, installed: unknown): boolean {
  if (typeof candidate !== 'string' || typeof installed !== 'string' ||
      !/^\d+(\.\d+){0,3}$/.test(candidate) || !/^\d+(\.\d+){0,3}$/.test(installed)) return false;
  const a=candidate.split('.').map(Number), b=installed.split('.').map(Number);
  for(let i=0;i<Math.max(a.length,b.length);i++) {
    const difference=(a[i]??0)-(b[i]??0);
    if(difference) return difference>0;
  }
  return false;
}
export function checkDue(last: unknown, now: number) {
  return typeof last !== 'number' || !Number.isFinite(last) || last <= 0 ||
    last > now || now-last >= UPDATE_CHECK_INTERVAL;
}
export function appStoreUpdate(payload: unknown, installed: string, systemVersion: string): string | null {
  const data=payload as {results?: {trackId?:number;bundleId?:string;version?:string;minimumOsVersion?:string}[]};
  if (!data || !Array.isArray(data.results)) return null;
  const app=data.results.find(item => item && item.trackId===6825627684 && item.bundleId==='com.mablic.kungfufisher');
  if(!app || !newerVersion(app.version,installed) || newerVersion(app.minimumOsVersion,systemVersion)) return null;
  return app.version!;
}
