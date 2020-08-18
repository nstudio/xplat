export interface ITargetPlatforms {
  web?: boolean;
  nativescript?: boolean;
  ionic?: boolean;
  electron?: boolean;
}

// Officially supported via xplat directly
export type PlatformTypes = 'web' | 'nativescript' | 'ionic' | 'electron';
// Proxy support via Nx
export type PlatformNxExtraTypes = 'express' | 'nest' | 'node' | 'react';
export type PlatformWithNxTypes = PlatformTypes | PlatformNxExtraTypes;
export type PlatformModes = PlatformTypes | 'fullstack';
export type FrameworkTypes = 'angular';
// TODO: support react/vue and more
// | 'react'
// | 'vue'
export type FrameworkOptions = FrameworkTypes | 'all';
