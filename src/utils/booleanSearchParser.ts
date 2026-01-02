import type { BooleanSearchQuery, SearchOperator } from '../types/discovery';

export class BooleanSearchParser {
  private tokens: string[] = [];
  private currentIndex = 0;

  parse(query: string): BooleanSearchQuery {
    this.tokenize(query);
    this.currentIndex = 0;
    return this.parseExpression();
  }

  private tokenize(query: string): void {
    const regex = /\(|\)|AND|OR|NOT|"[^"]*"|[^\s()]+/g;
    this.tokens = query.match(regex) || [];
  }

  private parseExpression(): BooleanSearchQuery {
    let left = this.parseTerm();

    while (this.currentIndex < this.tokens.length) {
      const token = this.tokens[this.currentIndex];

      if (token === 'AND' || token === 'OR') {
        this.currentIndex++;
        const right = this.parseTerm();
        left = {
          operator: token as SearchOperator,
          children: [left, right]
        };
      } else {
        break;
      }
    }

    return left;
  }

  private parseTerm(): BooleanSearchQuery {
    const token = this.tokens[this.currentIndex];

    if (token === 'NOT') {
      this.currentIndex++;
      const term = this.parseTerm();
      return {
        operator: 'NOT',
        children: [term]
      };
    }

    if (token === '(') {
      this.currentIndex++;
      const expr = this.parseExpression();
      this.currentIndex++; // skip ')'
      return expr;
    }

    this.currentIndex++;
    return {
      term: token.replace(/"/g, '')
    };
  }

  validate(query: string): { valid: boolean; error?: string } {
    try {
      const openParens = (query.match(/\(/g) || []).length;
      const closeParens = (query.match(/\)/g) || []).length;

      if (openParens !== closeParens) {
        return {
          valid: false,
          error: 'Mismatched parentheses'
        };
      }

      const tokens = query.match(/AND|OR|NOT|"[^"]*"|[^\s()]+/g) || [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const nextToken = tokens[i + 1];

        if ((token === 'AND' || token === 'OR') && !nextToken) {
          return {
            valid: false,
            error: `${token} operator must be followed by a term`
          };
        }

        if (token === 'NOT' && !nextToken) {
          return {
            valid: false,
            error: 'NOT operator must be followed by a term'
          };
        }
      }

      this.parse(query);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid search syntax'
      };
    }
  }

  highlight(query: string): Array<{ text: string; type: 'operator' | 'term' | 'paren' }> {
    const tokens: Array<{ text: string; type: 'operator' | 'term' | 'paren' }> = [];
    const regex = /\(|\)|AND|OR|NOT|"[^"]*"|[^\s()]+/g;
    let match;

    while ((match = regex.exec(query)) !== null) {
      const token = match[0];

      if (token === 'AND' || token === 'OR' || token === 'NOT') {
        tokens.push({ text: token, type: 'operator' });
      } else if (token === '(' || token === ')') {
        tokens.push({ text: token, type: 'paren' });
      } else {
        tokens.push({ text: token, type: 'term' });
      }
    }

    return tokens;
  }

  toReadableString(ast: BooleanSearchQuery): string {
    if (ast.term) {
      return ast.term;
    }

    if (ast.operator === 'NOT' && ast.children && ast.children.length > 0) {
      return `NOT (${this.toReadableString(ast.children[0])})`;
    }

    if (ast.children && ast.children.length >= 2) {
      const left = this.toReadableString(ast.children[0]);
      const right = this.toReadableString(ast.children[1]);
      return `(${left} ${ast.operator} ${right})`;
    }

    return '';
  }

  extractTerms(ast: BooleanSearchQuery): string[] {
    if (ast.term) {
      return [ast.term];
    }

    if (ast.children) {
      return ast.children.flatMap(child => this.extractTerms(child));
    }

    return [];
  }
}

export const booleanSearchParser = new BooleanSearchParser();

export function getSampleQueries(): Array<{ label: string; query: string; description: string }> {
  return [
    {
      label: 'Executive in SaaS',
      query: '(CEO OR CTO OR VP) AND (SaaS OR Software)',
      description: 'Find C-level executives at SaaS companies'
    },
    {
      label: 'Tech excluding retail',
      query: 'Technology AND NOT (Retail OR E-commerce)',
      description: 'Technology companies not in retail'
    },
    {
      label: 'Enterprise decision makers',
      query: '(Director OR VP OR "C-level") AND (Enterprise OR "Large Company")',
      description: 'Senior roles at enterprise companies'
    },
    {
      label: 'Healthcare IT leaders',
      query: '(Healthcare OR Medical) AND (IT OR Technology OR CTO)',
      description: 'Technology leaders in healthcare'
    },
    {
      label: 'Funded startups',
      query: '(Startup OR "Early Stage") AND (Funded OR "Series A" OR "Series B")',
      description: 'Recently funded startup companies'
    }
  ];
}
