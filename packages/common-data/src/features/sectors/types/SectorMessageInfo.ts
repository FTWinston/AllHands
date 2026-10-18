/** Sector intro/outro/defeat message shown on the viewscreen. */
export interface SectorMessageInfo {
    kind: 'intro' | 'outro' | 'defeat';
    title: string;
    text: string;
}
