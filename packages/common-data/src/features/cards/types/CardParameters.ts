export type CardParametersBase = Readonly<Record<string, number>>;

export type CardParameters = Readonly<{ cost: number }> & CardParametersBase;
