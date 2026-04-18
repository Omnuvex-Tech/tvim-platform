export type UITheme = "light" | "dark";

export type UIState = {
    theme: UITheme;
};

export type UIActions = {
    setTheme: (theme: UITheme) => void;
};
