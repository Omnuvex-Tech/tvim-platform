export type Slider = {
    id: number;
    image: string;
    mobile_image: string | null;
    title: string | null;
    description: string | null;
    button_text: string | null;
    button_link: string | null;
    action_type: string | null;
    hide_text_mobile: boolean;
    sort_order: number;
    is_active: boolean;
};
