// Message pools — poems, motivational, compliments in Arabic and English
// Each message has: text, lang ('ar' or 'en'), category

export const messages = [
    // Arabic poems
    {
        text: 'ما أجملَ الدنيا إذا\nكنتِ الحكاية والختام',
        lang: 'ar',
        category: 'poem'
    },
    {
        text: 'يا من سكنتِ فؤادي\nقبل أن أعرف الهوى\nكأنّكِ كنتِ هناك\nمنذ الأزل',
        lang: 'ar',
        category: 'poem'
    },
    {
        text: 'وإنّي لأهوى النومَ في غيرِ حينهِ\nلعلّ لقاءً في المنامِ يكونُ',
        lang: 'ar',
        category: 'poem'
    },
    {
        text: 'أحبّكِ حبّاً لو تحبّين مثله\nأصابكِ من وجدٍ عليّ جنونُ',
        lang: 'ar',
        category: 'poem'
    },
    {
        text: 'فللورد شهر واحد ثم ينقضي\nووردك باقٍ لا يزول عن الخد',
        lang: 'ar',
        category: 'poem'
    },
    {
        text: 'لم أرَ شمساً بليلٍ قبلها طلعت\nحتّى تجلّت لنا في ليلة الظُلَمِ',
        lang: 'ar',
        category: 'poem'
    },

    // English poems / poetic lines
    {
        text: 'She walks in beauty, like the night\nOf cloudless climes and starry skies;\nAnd all that\'s best of dark and bright\nMeet in her aspect and her eyes.',
        lang: 'en',
        category: 'poem'
    },
    {
        text: 'I carry your heart with me.\nI carry it in my heart.\nI am never without it.',
        lang: 'en',
        category: 'poem'
    },

    // Arabic motivational
    {
        text: 'كوني كالقمر\nيضيء للناس\nرغم أنه غير مكتمل',
        lang: 'ar',
        category: 'motivational'
    },
    {
        text: 'لا تطفئي النور الذي بداخلكِ\nلأن الآخرين يبهرهم السطوع',
        lang: 'ar',
        category: 'motivational'
    },
    {
        text: 'أنتِ أقوى مما تظنين\nوأجمل مما تتخيلين\nوأكثر قيمة مما تعرفين',
        lang: 'ar',
        category: 'motivational'
    },
    {
        text: 'كلّ يومٍ جديد\nهو فرصة لتكوني\nأقرب إلى النسخة\nالتي تحلمين بها',
        lang: 'ar',
        category: 'motivational'
    },

    // English motivational
    {
        text: 'You are allowed to be\nboth a masterpiece\nand a work in progress\nsimultaneously.',
        lang: 'en',
        category: 'motivational'
    },
    {
        text: 'The world changes\nwhen you show up as yourself.\nNot a version of you.\nYou.',
        lang: 'en',
        category: 'motivational'
    },

    // Arabic compliments
    {
        text: 'وجودكِ يصنع الفرق\nابتسامتكِ تضيء المكان\nروحكِ نعمة',
        lang: 'ar',
        category: 'compliment'
    },
    {
        text: 'أنتِ من النوع الذي\nيجعل الدنيا أجمل\nبمجرد وجوده فيها',
        lang: 'ar',
        category: 'compliment'
    },
    {
        text: 'كلماتكِ لها وقع مختلف\nحضوركِ له أثر\nوقلبكِ لا يشبه أحداً',
        lang: 'ar',
        category: 'compliment'
    },
    {
        text: 'يا من جعلت الحياة\nتستحق أن تُعاش\nأنتِ الأمان في\nعالمٍ لا يهدأ',
        lang: 'ar',
        category: 'compliment'
    },

    // English compliments
    {
        text: 'Your presence makes\nthe ordinary feel sacred.\nThe way you move through life\nis a quiet kind of magic.',
        lang: 'en',
        category: 'compliment'
    },
    {
        text: 'You make kindness look effortless\nand strength look gentle.\nThe world is softer\nbecause you\'re in it.',
        lang: 'en',
        category: 'compliment'
    },
    {
        text: 'Some people light up a room\nwhen they walk in.\nYou light up the people in it.',
        lang: 'en',
        category: 'compliment'
    },

    // Mixed — short Arabic whispers
    {
        text: 'أنسام.\nاسمكِ وحده يكفي\nليكون يوماً جميلاً.',
        lang: 'ar',
        category: 'compliment'
    },
    {
        text: 'لكِ من اسمكِ نصيب\nنسائم لا تُرى\nلكنها تُحيي كلّ شيء',
        lang: 'ar',
        category: 'poem'
    },
];

// Get a message for a given day (deterministic rotation)
export function getMessageForDay(dayOfYear) {
    return messages[dayOfYear % messages.length];
}

// Get a message by category for a given day
export function getMessageByCategoryForDay(category, dayOfYear) {
    const filtered = messages.filter(m => m.category === category);
    if (filtered.length === 0) return messages[dayOfYear % messages.length];
    return filtered[dayOfYear % filtered.length];
}

// Get day of year (1-366)
export function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}
