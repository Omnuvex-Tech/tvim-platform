declare module "react-flags" {
    import type { ComponentPropsWithoutRef, FC } from "react";

    type FlagProps = ComponentPropsWithoutRef<"img"> & {
        country: string;
    };

    const Flag: FC<FlagProps>;

    export default Flag;
}
