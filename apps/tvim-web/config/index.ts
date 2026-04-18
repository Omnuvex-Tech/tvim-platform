import { project } from "./project";
import { api } from "./api";
import { endpoints } from "./endpoints";

export const config = {
    project,
    api,
    endpoints,
} as const;

export { system } from "./system";
