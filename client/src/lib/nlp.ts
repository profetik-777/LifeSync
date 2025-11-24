import { getTodayDate } from './constants';

export interface ParsedTitleData {
  cleanTitle: string;
  detectedDate?: string;
  detectedTime?: string;
  detectedEndTime?: string;
  detectedLocation?: string;
}

export function parseNaturalLanguageTitle(title: string): ParsedTitleData {
  let cleanTitle = title.trim();
  let detectedDate: string | undefined;
  let detectedTime: string | undefined;
  let detectedEndTime: string | undefined;
  let detectedLocation: string | undefined;

  // Date patterns
  const datePatterns = [
    {
      pattern: /\b(today)\b/gi,
      getValue: () => getTodayDate()
    },
    {
      pattern: /\b(tomorrow)\b/gi,
      getValue: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
    },
    {
      pattern: /\b(next week)\b/gi,
      getValue: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
      }
    },
    {
      pattern: /\b(?:this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      getValue: (match: string) => {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        // Extract just the day name from match (remove "this" or "next" if present)
        const dayMatch = match.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
        if (!dayMatch) return undefined;
        
        const targetDay = daysOfWeek.indexOf(dayMatch[1].toLowerCase());
        const today = new Date();
        const todayDay = today.getDay();
        
        let daysUntilTarget = targetDay - todayDay;
        
        // Handle "next [day]" specifically - always go to next week
        if (match.toLowerCase().includes('next')) {
          if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
          } else {
            daysUntilTarget += 7; // Always next week for "next [day]"
          }
        } else {
          // For "this [day]" or just "[day]", go to the next occurrence
          if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
          }
        }
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilTarget);
        return targetDate.toISOString().split('T')[0];
      }
    }
  ];

  // Time patterns
  const timePatterns = [
    {
      pattern: /\bat\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/gi,
      getValue: (match: string) => {
        const timeMatch = match.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const ampm = timeMatch[3].toLowerCase();
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return undefined;
      }
    },
    {
      pattern: /\bat\s+(\d{1,2})\s*(am|pm)/gi,
      getValue: (match: string) => {
        const timeMatch = match.match(/(\d{1,2})\s*(am|pm)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const ampm = timeMatch[2].toLowerCase();
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, '0')}:00`;
        }
        return undefined;
      }
    },
    {
      pattern: /\bat\s+(\d{1,2}):(\d{2})/gi,
      getValue: (match: string) => {
        const timeMatch = match.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return undefined;
      }
    }
  ];

  // Location patterns (looking for "at [location]" but not time)
  const locationPatterns = [
    {
      pattern: /\bat\s+([^0-9\s][^,\n]*?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at\s+\d)|\s*$)/gi,
      getValue: (match: string) => {
        const locationMatch = match.match(/at\s+([^0-9\s][^,\n]*?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at\s+\d)|\s*$)/i);
        return locationMatch ? locationMatch[1].trim() : undefined;
      }
    }
  ];

  // Parse dates
  for (const datePattern of datePatterns) {
    const match = cleanTitle.match(datePattern.pattern);
    if (match) {
      detectedDate = datePattern.getValue(match[0]);
      cleanTitle = cleanTitle
        .replace(datePattern.pattern, '')
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
        .replace(/\s+([.!?])/g, '$1'); // Remove spaces before punctuation
      break;
    }
  }

  // Parse times
  for (const timePattern of timePatterns) {
    const match = cleanTitle.match(timePattern.pattern);
    if (match) {
      const time = timePattern.getValue(match[0]);
      if (time) {
        detectedTime = time;
        // Calculate end time (1 hour later)
        const [hours, minutes] = time.split(':').map(Number);
        const endHour = hours + 1;
        detectedEndTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        cleanTitle = cleanTitle.replace(timePattern.pattern, '').trim();
        break;
      }
    }
  }

  // Parse locations (only if no time was found in that position)
  if (!detectedTime) {
    for (const locationPattern of locationPatterns) {
      const match = cleanTitle.match(locationPattern.pattern);
      if (match) {
        const location = locationPattern.getValue(match[0]);
        if (location && !location.match(/\d{1,2}:?\d{0,2}\s*(am|pm)?/i)) {
          detectedLocation = location;
          cleanTitle = cleanTitle.replace(locationPattern.pattern, '').trim();
          break;
        }
      }
    }
  } else {
    // If time was found, look for location in a different way
    const locationMatch = cleanTitle.match(/\bat\s+([^0-9][^,\n]*?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\s*$)/i);
    if (locationMatch) {
      detectedLocation = locationMatch[1].trim();
      cleanTitle = cleanTitle.replace(/\bat\s+[^0-9][^,\n]*?(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\s*$)/i, '').trim();
    }
  }

  // Clean up extra spaces and normalize
  cleanTitle = cleanTitle
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
    .replace(/\s+([.!?])/g, '$1'); // Remove spaces before punctuation
  
  // Capitalize first letter
  if (cleanTitle) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  return {
    cleanTitle,
    detectedDate,
    detectedTime,
    detectedEndTime,
    detectedLocation
  };
}