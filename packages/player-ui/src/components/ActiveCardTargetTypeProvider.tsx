import { createContext, useState, ReactNode } from "react";

type CardTargetType = string | null;

export const ActiveCardTargetTypeContext = createContext<CardTargetType>(null);

export const ActiveCardTargetTypeSetterContext = createContext<((cardType: CardTargetType) => void)>(() => {});

export const ActiveCardTargetTypeProvider = ({ children }: { children: ReactNode }) => {
	const [activeCardTargetType, setActiveCardTargetType] = useState<CardTargetType>(null);

	return (
		<ActiveCardTargetTypeContext.Provider value={activeCardTargetType}>
			<ActiveCardTargetTypeSetterContext.Provider value={setActiveCardTargetType}>
				{children}
			</ActiveCardTargetTypeSetterContext.Provider>
		</ActiveCardTargetTypeContext.Provider>
	);
};
