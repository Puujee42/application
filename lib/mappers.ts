import { Monk } from '../src/types/schema';

export interface MonkUIModel {
    id: string;
    name: string;
    title: string;
    avatarUrl: string;
    rating: string;
    experienceText: string;
    priceNum: number;
    priceFormatted: string;
    tags: string[];
    isSpecial: boolean;
}

export const mapMonkToUI = (monk: Monk, lang: string = 'mn'): MonkUIModel => {
    const tStr = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val[lang] || val.mn || val.en || '';
    };

    const rating = (monk as any).rating || 4.9;
    const price = monk.services && monk.services.length > 0
        ? monk.services[0].price
        : (monk.isSpecial ? 888000 : 50000);

    return {
        id: monk._id || (monk as any).id || '',
        name: tStr(monk.name),
        title: tStr(monk.title),
        avatarUrl: (monk as any).imageUrl || monk.image || 'https://via.placeholder.com/150',
        rating: rating.toFixed(1),
        experienceText: `(${monk.yearsOfExperience || 0} жил)`,
        priceNum: price,
        priceFormatted: `${price.toLocaleString()}₮`,
        tags: monk.specialties ? monk.specialties.slice(0, 3) : [],
        isSpecial: !!monk.isSpecial,
    };
};
