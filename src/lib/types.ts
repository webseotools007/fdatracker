export const kinds = ["warning","483","recall","approval"] as const;
export type Kind = typeof kinds[number];
export type Role = "admin" | "user";
export type RecordItem = {
 id:string;kind:Kind;title:string;company:string;date:string;summary:string;url:string;
 source:string;reference:boolean;details:Record<string,string>;hash:string;version:number;
 status:"pending"|"approved"|"rejected";captured_at:string;
};
export const labels:Record<Kind,string>={warning:"Warning letters","483":"Public Form 483s",recall:"Drug recalls",approval:"Drug approvals"};
export type Incoming = Omit<RecordItem,"id"|"hash"|"version"|"status"|"captured_at"> & {externalId:string};
