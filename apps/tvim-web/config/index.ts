import { project } from "./project";
import { api } from "./api";
import { endpoints } from "./endpoints";
import { pages } from "./pages";

export const config = {
    project,
    api,
    endpoints,
    pages,
} as const;

export { system } from "./system";
