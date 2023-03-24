export interface Tag {
    id : number;
    title : string;
    slug : string;
}

export interface Feature {
    geometry:{coordinates: number[]};
}

export interface Initiative {
    id : number;
    tags : Tag[];
    locations : {features : Feature[]};
    main_image_url : string;
    initiative_title_texts : {text : string}[];
    initiative_description_texts : {text : string}[];
}