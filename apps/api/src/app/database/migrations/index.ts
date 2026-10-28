import { InitialSchema1798000000000 } from './1798000000000-initial-schema';
import { MemberLogin1798000000001 } from './1798000000001-member-login';

// Migrations are listed explicitly because the API is bundled with webpack,
// so TypeORM cannot discover them with a glob at runtime.
export const migrations = [InitialSchema1798000000000, MemberLogin1798000000001];
