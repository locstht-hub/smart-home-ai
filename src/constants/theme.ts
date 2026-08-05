export const AppTheme = {
    colors: {
        canvas: '#edf3f0',
        surface: '#f8fbf9',
        surfaceMuted: '#eef4f1',
        ink: '#13251f',
        inkMuted: '#61736c',
        border: '#d3e0da',
        brand: '#0f766e',
        brandDark: '#115e59',
        header: '#10251f',
        danger: '#b42318',
        dangerSurface: '#fff4f2',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    },
    radius: {
        sm: 10,
        md: 14,
        lg: 20,
        xl: 26,
    },
    typography: {
        display: { fontSize: 30, fontWeight: '900' as const, letterSpacing: -0.4 },
        title: { fontSize: 25, fontWeight: '900' as const, letterSpacing: -0.3 },
        section: { fontSize: 17, fontWeight: '800' as const },
        body: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
        label: { fontSize: 13, fontWeight: '800' as const },
        numeric: { fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
    },
} as const;

