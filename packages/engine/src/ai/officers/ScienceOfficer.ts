import { Officer } from './Officer';

export class ScienceOfficer extends Officer {
    readonly role = 'science' as const;
}
