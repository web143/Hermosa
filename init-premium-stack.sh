#!/bin/bash
echo "⚡ Instalando Ecosistema de Diseño Premium..."

# 1. Dependencias Core de Animación y Scroll
pnpm add @darkroomengineering/lenis framer-motion lucide-react clsx tailwind-merge

# 2. Inicializar Skiper UI (Base Shadcn)
npx shadcn add @skiper-ui/skiper40

# 3. Agregar Componente Split de Watermelon UI
pnpm dlx shadcn@latest add https://registry.watermelon.sh/r/card-split-accordian.json

# 4. Agregar Shaders de Cult UI (Hero Color Panels)
pnpm dlx shadcn@latest add https://cult-ui.com/r/hero-color-panel.json

# 5. Agregar Soporte de Inspira UI
pnpm add @framer-motion/plugin # Si usas complementos específicos
echo "🎯 ¡Ecosistema instalado y listo para usar en Antigravity IDE!"
