import { TaskTag } from '@/types';

export const TAG_CATEGORIES = {
    TECHNOLOGY: 'Technology',
    PROJECT_TYPE: 'Project Type',
    PRIORITY_LEVEL: 'Priority Level',
    TEAM: 'Team',
    STATUS: 'Status',
    SKILL_AREA: 'Skill Area',
    PLATFORM: 'Platform',
} as const;

export const PREDEFINED_TAGS: TaskTag[] = [
    // Technology
    { name: 'react', category: TAG_CATEGORIES.TECHNOLOGY, color: '#61DAFB' },
    { name: 'nextjs', category: TAG_CATEGORIES.TECHNOLOGY, color: '#000000' },
    { name: 'typescript', category: TAG_CATEGORIES.TECHNOLOGY, color: '#3178C6' },
    { name: 'javascript', category: TAG_CATEGORIES.TECHNOLOGY, color: '#F7DF1E' },
    { name: 'nodejs', category: TAG_CATEGORIES.TECHNOLOGY, color: '#339933' },
    { name: 'mongodb', category: TAG_CATEGORIES.TECHNOLOGY, color: '#47A248' },
    { name: 'tailwind', category: TAG_CATEGORIES.TECHNOLOGY, color: '#06B6D4' },
    { name: 'css', category: TAG_CATEGORIES.TECHNOLOGY, color: '#1572B6' },
    { name: 'html', category: TAG_CATEGORIES.TECHNOLOGY, color: '#E34F26' },

    // Project Type
    { name: 'frontend', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#FF6B6B' },
    { name: 'backend', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#4ECDC4' },
    { name: 'fullstack', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#45B7D1' },
    { name: 'api', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#96CEB4' },
    { name: 'database', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#FECA57' },
    { name: 'ui', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#FF9FF3' },
    { name: 'ux', category: TAG_CATEGORIES.PROJECT_TYPE, color: '#54A0FF' },

    // Priority Level
    { name: 'urgent', category: TAG_CATEGORIES.PRIORITY_LEVEL, color: '#FF4757' },
    { name: 'important', category: TAG_CATEGORIES.PRIORITY_LEVEL, color: '#FFA502' },
    { name: 'nice-to-have', category: TAG_CATEGORIES.PRIORITY_LEVEL, color: '#7BED9F' },
    { name: 'quick-win', category: TAG_CATEGORIES.PRIORITY_LEVEL, color: '#70A1FF' },

    // Team
    { name: 'solo', category: TAG_CATEGORIES.TEAM, color: '#5F27CD' },
    { name: 'team', category: TAG_CATEGORIES.TEAM, color: '#00D2D3' },
    { name: 'collaboration', category: TAG_CATEGORIES.TEAM, color: '#FF6B9D' },
    { name: 'review-needed', category: TAG_CATEGORIES.TEAM, color: '#C44569' },

    // Status
    { name: 'bug', category: TAG_CATEGORIES.STATUS, color: '#EA2027' },
    { name: 'fix', category: TAG_CATEGORIES.STATUS, color: '#009432' },
    { name: 'enhancement', category: TAG_CATEGORIES.STATUS, color: '#0652DD' },
    { name: 'refactor', category: TAG_CATEGORIES.STATUS, color: '#9C88FF' },
    { name: 'testing', category: TAG_CATEGORIES.STATUS, color: '#FD79A8' },
    { name: 'documentation', category: TAG_CATEGORIES.STATUS, color: '#FDCB6E' },

    // Skill Area
    { name: 'learning', category: TAG_CATEGORIES.SKILL_AREA, color: '#6C5CE7' },
    { name: 'research', category: TAG_CATEGORIES.SKILL_AREA, color: '#A29BFE' },
    { name: 'design', category: TAG_CATEGORIES.SKILL_AREA, color: '#E17055' },
    { name: 'architecture', category: TAG_CATEGORIES.SKILL_AREA, color: '#2D3436' },
    { name: 'performance', category: TAG_CATEGORIES.SKILL_AREA, color: '#00B894' },
    { name: 'security', category: TAG_CATEGORIES.SKILL_AREA, color: '#D63031' },

    // Platform
    { name: 'web', category: TAG_CATEGORIES.PLATFORM, color: '#0984E3' },
    { name: 'mobile', category: TAG_CATEGORIES.PLATFORM, color: '#00CEC9' },
    { name: 'desktop', category: TAG_CATEGORIES.PLATFORM, color: '#6C5CE7' },
    { name: 'responsive', category: TAG_CATEGORIES.PLATFORM, color: '#FDCB6E' },
];

export function getTagsByCategory(category: string): TaskTag[] {
    return PREDEFINED_TAGS.filter(tag => tag.category === category);
}

export function getTagColor(tagName: string): string {
    const tag = PREDEFINED_TAGS.find(t => t.name === tagName);
    return tag?.color || '#64748B'; // Default gray color
}

export function getTagCategory(tagName: string): string {
    const tag = PREDEFINED_TAGS.find(t => t.name === tagName);
    return tag?.category || 'Custom';
}

export function getAllCategories(): string[] {
    return Object.values(TAG_CATEGORIES);
}