export default {
    plugins: [
        'prettier-plugin-astro',
        'prettier-plugin-tailwindcss', // needs to be last
    ],
    tabWidth: 4,
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 80,
    useTabs: true,
    overrides: [
        {
            files: '*.astro',
            options: {
                parser: 'astro',
            },
        },
    ],
};
