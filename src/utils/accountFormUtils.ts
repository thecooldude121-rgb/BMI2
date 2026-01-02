export const validateURL = (url: string): boolean => {
  if (!url) return false;
  const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return urlPattern.test(url);
};

export const formatURL = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  return `https://www.${url}`;
};

export const formatLinkedInURL = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) {
    return url;
  }
  if (url.startsWith('/company/') || url.startsWith('/in/')) {
    return `https://linkedin.com${url}`;
  }
  if (url.startsWith('linkedin.com')) {
    return `https://${url}`;
  }
  return `https://linkedin.com/company/${url}`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US');
};

export const calculateCompanyAge = (month: string, year: number): string => {
  if (!month || !year) return '';

  const monthIndex = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].indexOf(month);

  if (monthIndex === -1) return '';

  const foundedDate = new Date(year, monthIndex, 1);
  const now = new Date();

  let years = now.getFullYear() - foundedDate.getFullYear();
  let months = now.getMonth() - foundedDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  if (months === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
};

export const calculateGrowthRate = (history: { [key: string]: number }): string => {
  const years = Object.keys(history).sort();
  if (years.length < 2) return '';

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const firstValue = history[firstYear];
  const lastValue = history[lastYear];

  if (!firstValue || !lastValue) return '';

  const yearsDiff = parseInt(lastYear) - parseInt(firstYear);
  const growth = ((lastValue - firstValue) / firstValue) * 100;
  const sign = growth >= 0 ? '+' : '';

  return `${sign}${growth.toFixed(0)}% in ${yearsDiff} ${yearsDiff === 1 ? 'year' : 'years'}`;
};

export const calculateTotalFunding = (rounds: Array<{ amount: number }>): number => {
  return rounds.reduce((sum, round) => sum + (round.amount || 0), 0);
};

export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key: string): any | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const { data, timestamp } = JSON.parse(stored);
    const hoursSinceUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

export const clearLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};
