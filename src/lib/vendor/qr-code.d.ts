export type QROptions = {margin?:number;width?:number;errorCorrectionLevel?:'L'|'M'|'Q'|'H'};
export type QRResult = {modules:{size:number;data:Uint8Array}};
declare const QRCode: {
 toDataURL(text:string,options?:QROptions):Promise<string>;
 toString(text:string,options?:QROptions):Promise<string>;
 create(text:string,options?:QROptions):QRResult;
};
export default QRCode;
