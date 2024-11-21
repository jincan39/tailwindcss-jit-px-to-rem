import { PluginAPI } from 'tailwindcss/types/config';

const plugin = require("tailwindcss/plugin");
const path = require("path");
const fs = require("fs");
const git = require('git-rev-sync');

interface CacheConfig {
  FILE_PATH: string;
  moduleCache: Record<string, any> | null;
}

export interface PluginOptions {
  maxPxValue?: number;
  propertyAliases?: CSSPropertyAliases;
  breakpoints?: Breakpoints;
  full?: boolean;
}

export type CSSPropertyAliases = {
  [key: string]: string;
}

export type Breakpoints = {
  [key: string]: number;
}

export interface Config {
  maxPxValue: number;
  propertyAliases: CSSPropertyAliases;
  breakpoints: Breakpoints;
}

export type UtilityStyles = {
  [key: string]: string | {
    [key: string]: string | {
      [key: string]: string;
    };
  };
};

type CacheUtils = {
  read: () => Record<string, UtilityStyles> | null;
  write: (data: Record<string, UtilityStyles>) => void;
  getKey: () => string;
}

const CACHE_CONFIG: CacheConfig = {
  FILE_PATH: path.join(__dirname, '.tailwind-utilities-cache.json'),
  moduleCache: null
};

const cacheUtils: CacheUtils = {
  read: () => {
    if (CACHE_CONFIG.moduleCache) return CACHE_CONFIG.moduleCache;

    try {
      if (fs.existsSync(CACHE_CONFIG.FILE_PATH)) {
        const cacheData = fs.readFileSync(CACHE_CONFIG.FILE_PATH, 'utf8');
        CACHE_CONFIG.moduleCache = JSON.parse(cacheData);
        return CACHE_CONFIG.moduleCache;
      }
    } catch (error) {
      console.error('Cache read error:', error);
      try {
        fs.unlinkSync(CACHE_CONFIG.FILE_PATH);
      } catch (e) {
        // todo
      }
    }
    return null;
  },

  write: (data) => {
    try {
      fs.writeFileSync(CACHE_CONFIG.FILE_PATH, JSON.stringify(data));
      CACHE_CONFIG.moduleCache = data;
    } catch (error) {
      console.error('Cache write error:', error);
    }
  },

  getKey: () => {
    try {
      return git.short();
    } catch (error) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
      );
      return packageJson.version;
    }
  }
};

const CSS_PROPERTY_ALIASES: CSSPropertyAliases = {
	w: 'width',
	h: 'height',
	'min-w': 'minWidth',
	'min-h': 'minHeight',
	'max-w': 'maxWidth',
	'max-h': 'maxHeight',
	m: 'margin',
	mt: 'marginTop',
	mr: 'marginRight',
	mb: 'marginBottom',
	ml: 'marginLeft',
	p: 'padding',
	pt: 'paddingTop',
	pr: 'paddingRight',
	pb: 'paddingBottom',
	pl: 'paddingLeft',
	gap: 'gap',
	'gap-x': 'columnGap',
	'gap-y': 'rowGap',
	text: 'fontSize',
	leading: 'lineHeight',
	tracking: 'letterSpacing',
	rounded: 'borderRadius',
	border: 'borderWidth',
	'border-t': 'borderTopWidth',
	'border-r': 'borderRightWidth',
	'border-b': 'borderBottomWidth',
	'border-l': 'borderLeftWidth',
	top: 'top',
	right: 'right',
	bottom: 'bottom',
	left: 'left'
  };

  const BREAKPOINTS: Breakpoints = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
	'max-sm': 640,
	'max-md': 768,
	'max-lg': 1024,
	'max-xl': 1280,
	'max-2xl': 1536
  };

const defaultConfig: Config = {
  maxPxValue: 2000,
  propertyAliases: {
    w: 'width',
    h: 'height',
    'min-w': 'minWidth',
    'min-h': 'minHeight',
    'max-w': 'maxWidth',
    'max-h': 'maxHeight',
    text: 'fontSize',
    leading: 'lineHeight',
    rounded: 'borderRadius',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left'
  },
  breakpoints: {
    sm: 640,
    'max-md': 768
  }
};

const generateUtilities = (e: (value: string) => string, options: PluginOptions): UtilityStyles => {
  const config = options.full
    ? {
        maxPxValue: options.maxPxValue || defaultConfig.maxPxValue,
        propertyAliases: CSS_PROPERTY_ALIASES,
        breakpoints: BREAKPOINTS
      }
    : {
        ...defaultConfig,
        ...options,
        propertyAliases: { ...defaultConfig.propertyAliases, ...options?.propertyAliases },
        breakpoints: { ...defaultConfig.breakpoints, ...options?.breakpoints }
      };

  const cacheKey = cacheUtils.getKey();
  const cache = cacheUtils.read();
  if (cache && cache[cacheKey]) {
    return cache[cacheKey];
  }

  const remValues = Array.from({ length: config.maxPxValue }, (_, i) => (i + 1) / 16);
  const utilities = Object.create(null);

  Object.entries(config.propertyAliases).forEach(([prefix, property]) => {
    for (let i = 0; i < config.maxPxValue; i++) {
      const px = i + 1;
      const rem = remValues[i];

      utilities[`.${e(`${prefix}-[${px}px]`)}`] = {
        [property]: `${rem}rem`
      };

      Object.entries(config.breakpoints).forEach(([breakpoint, width]) => {
        utilities[`.${e(`${breakpoint}:${prefix}-[${px}px]`)}`] = {
          [`@media not all and (min-width: ${width}px)`]: {
            [property]: `${rem}rem`
          }
        };
      });

      if (prefix === 'm' || prefix === 'p') {
        const isMargin = prefix === 'm';
        const baseProp = isMargin ? 'margin' : 'padding';

        utilities[`.${e(`${prefix}x-[${px}px]`)}`] = {
          [`${baseProp}Left`]: `${rem}rem`,
          [`${baseProp}Right`]: `${rem}rem`
        };

        utilities[`.${e(`${prefix}y-[${px}px]`)}`] = {
          [`${baseProp}Top`]: `${rem}rem`,
          [`${baseProp}Bottom`]: `${rem}rem`
        };
      }

      if (prefix === 'rounded') {
        const directions = {
          t: ['borderTopLeftRadius', 'borderTopRightRadius'],
          r: ['borderTopRightRadius', 'borderBottomRightRadius'],
          b: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
          l: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
          tl: ['borderTopLeftRadius'],
          tr: ['borderTopRightRadius'],
          br: ['borderBottomRightRadius'],
          bl: ['borderBottomLeftRadius']
        };

        Object.entries(directions).forEach(([direction, properties]) => {
          const className = direction
            ? `.${e(`${prefix}-${direction}-[${px}px]`)}`
            : `.${e(`${prefix}-[${px}px]`)}`;
          utilities[className] = properties.reduce((styles: { [key: string]: string }, prop) => {
            styles[prop] = `${rem}rem`;
            return styles;
          }, {});
        });
      }
    }
  });

  cacheUtils.write({ [cacheKey]: utilities });
  return utilities;
};

const tailwindPxToRemPlugin = plugin.withOptions((options: PluginOptions = {}) => {
	return function ({ addUtilities, e }: PluginAPI) {
		const utilities = generateUtilities(e, options);
		addUtilities(utilities);
	};
});

export default tailwindPxToRemPlugin;
