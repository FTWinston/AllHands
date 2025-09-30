import { createContext, useState, ReactNode } from "react";

export type ActiveCardInfo = {
	id: number;
	targetType: string;
}

export const ActiveCardContext = createContext<ActiveCardInfo | null>(null);

export const SetActiveCardContext = createContext<((cardType: ActiveCardInfo | null) => void)>(() => {});

export const ActiveCardProvider = ({ children }: { children: ReactNode }) => {
	const [activeCard, setActiveCard] = useState<ActiveCardInfo | null>(null);

	return (
		<ActiveCardContext.Provider value={activeCard}>
			<SetActiveCardContext.Provider value={setActiveCard}>
				{children}
			</SetActiveCardContext.Provider>
		</ActiveCardContext.Provider>
	);
};
