'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import * as IoIcons from 'react-icons/io5';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export default function DynamicIcon({ name, ...props }: DynamicIconProps) {
  let IconComponent = (LucideIcons as any)[name];

  // Si no se encuentra en Lucide, intentar buscar en Ionicons (react-icons/io5)
  if (!IconComponent) {
    let ioName = name;
    // Autocompletar para nombres en formato kebab-case de Ionicons (ej. logo-apple -> IoLogoApple)
    if (name.includes('-')) {
      ioName = 'Io' + name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    } else if (!name.startsWith('Io')) {
      ioName = 'Io' + name;
    }
    IconComponent = (IoIcons as any)[ioName] || (IoIcons as any)[name];
  }

  if (!IconComponent) {
    const FallbackIcon = LucideIcons.HelpCircle;
    return <FallbackIcon {...props} />;
  }

  return <IconComponent {...props} />;
}

// Catálogo agrupado de íconos para Gamer Loot
export const ICON_CATEGORIES = [
  {
    name: 'Hardware y Componentes',
    icons: [
      'Cpu', 'HardDrive', 'MemoryStick', 'Server', 'Fan', 'Microchip', 'Battery', 
      'Power', 'Plug', 'Cable'
    ]
  },
  {
    name: 'Dispositivos y Periféricos',
    icons: [
      'Monitor', 'Keyboard', 'Mouse', 'Gamepad2', 'Headphones', 'Headset', 'Mic', 
      'Speaker', 'Webcam', 'Printer', 'Laptop', 'Smartphone', 'Tablet', 'Tv', 'Watch'
    ]
  },
  {
    name: 'Conectividad',
    icons: [
      'Wifi', 'Bluetooth', 'Router', 'Usb', 'Cast', 'Radio', 'Signal'
    ]
  },
  {
    name: 'E-commerce y Ventas',
    icons: [
      'ShoppingCart', 'ShoppingBag', 'Store', 'Tag', 'Gift', 'Truck', 'CreditCard', 
      'Wallet', 'Percent', 'Ticket', 'BadgeDollarSign', 'Banknote'
    ]
  },
  {
    name: 'Marcas (Ionicons)',
    icons: [
      'IoLogoApple', 'IoLogoWindows', 'IoLogoAndroid', 'IoLogoPlaystation', 
      'IoLogoXbox', 'IoLogoSteam', 'IoLogoTwitch', 'IoLogoYoutube', 
      'IoLogoFacebook', 'IoLogoInstagram', 'IoLogoTiktok', 'IoLogoDiscord'
    ]
  },
  {
    name: 'Interfaz y Diseño',
    icons: [
      'Image', 'Video', 'GalleryHorizontal', 'LayoutTemplate', 'LayoutList', 
      'Star', 'Award', 'ShieldCheck', 'Settings', 'Search', 'Menu', 'Home', 'User'
    ]
  }
];
