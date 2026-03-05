export type RitualItem = {
    id: string; // We'll add a unique ID for React keys
    name: string;
    desc: string;
};

export type RitualCategory = {
    category: string;
    items: RitualItem[];
};

export const RITUALS_DATA: RitualCategory[] = [
    {
        category: "Догжүр",
        items: [
            { id: "dogjur-1", name: "Догжүр", desc: "Саад зэтгэрийг арилгах, ажил үйлс бүтээх" },
        ]
    },
    {
        category: "Хатуу засал",
        items: [
            { id: "hatuu-1", name: "Цагаан шүхэрт", desc: "Гай барцад, хэл ам, харшлах шалтгаан бүгдийг арилгана" },
        ]
    },
    {
        category: "Лүд",
        items: [
            { id: "lud-1", name: "Лүд уншуулах", desc: "Биеийн өвчин шаналал, гай барцадыг орлуулан золиослох" }
        ]
    },
    {
        category: "Чивил",
        items: [
            { id: "chivil-1", name: "Чивил зайлуулах", desc: "Муу зүүд, хар хэл ам, атаа жөтөө, муу бүхнийг зайлуулах" }
        ]
    },
    {
        category: "Тахилга",
        items: [
            { id: "tahilga-1", name: "Овоо тахих", desc: "Лусын хорлол, газар хөдлөх зэрэг байгалийн гамшгаас хамгаалах" }
        ]
    },
    {
        category: "Сан",
        items: [
            { id: "san-1", name: "Хийморийн сан", desc: "Хийморь лундааг сэргээх, ажил үйлст тэгшрэх" }
        ]
    },
    {
        category: "Сэржэм",
        items: [
            { id: "serjem-1", name: "Говийн лха", desc: "Эд баялаг, заяа буян арвижуулах" }
        ]
    },
    {
        category: "Даллага",
        items: [
            { id: "dallaga-1", name: "Баяннамсрайн даллага", desc: "Эд агуурс, олз омог, санхүүгийн гачигдал орлого нэмэгдүүлэх" }
        ]
    },
    {
        category: "Элдэв засал",
        items: [
            { id: "eldev-1", name: "Мэнгэний засал", desc: "Тухайн жилийн 9 мэнгэний үр дагавраас сэргийлэх засал" },
            { id: "eldev-2", name: "Жилийн засал", desc: "Жил орсон эсвэл урвасан хүмүүсийн засал" }
        ]
    }
];
