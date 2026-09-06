export type CardParametersBase = Readonly<Partial<Record<string, number>>>;

export type CardParameters = Readonly<{ cost: number }> & CardParametersBase;
