/**
 * Micro-animation system using Web Animations API
 */

export const defaultTiming: KeyframeAnimationOptions = {
  duration: 250,
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  fill: 'both',
};

/**
 * Fades an element in
 */
export function fadeIn(element: HTMLElement, options: KeyframeAnimationOptions = {}) {
  const keyframes = [
    { opacity: 0 },
    { opacity: 1 }
  ];
  return element.animate(keyframes, { ...defaultTiming, ...options });
}

/**
 * Fades an element out
 */
export function fadeOut(element: HTMLElement, options: KeyframeAnimationOptions = {}) {
  const keyframes = [
    { opacity: 1 },
    { opacity: 0 }
  ];
  return element.animate(keyframes, { ...defaultTiming, ...options });
}

/**
 * Slides an element up while fading in
 */
export function slideUp(element: HTMLElement, distance: number = 20, options: KeyframeAnimationOptions = {}) {
  const keyframes = [
    { opacity: 0, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' }
  ];
  return element.animate(keyframes, { ...defaultTiming, ...options });
}

/**
 * Slides an element down while fading out
 */
export function slideDown(element: HTMLElement, distance: number = 20, options: KeyframeAnimationOptions = {}) {
  const keyframes = [
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: `translateY(${distance}px)` }
  ];
  return element.animate(keyframes, { ...defaultTiming, ...options });
}

/**
 * Scales an element in from a smaller size
 */
export function scaleIn(element: HTMLElement, startScale: number = 0.95, options: KeyframeAnimationOptions = {}) {
  const keyframes = [
    { opacity: 0, transform: `scale(${startScale})` },
    { opacity: 1, transform: 'scale(1)' }
  ];
  return element.animate(keyframes, { ...defaultTiming, ...options });
}

/**
 * Staggers a specific animation across multiple children
 */
export function staggerChildren(
  container: HTMLElement, 
  animationFn: (el: HTMLElement, opts: KeyframeAnimationOptions) => Animation,
  staggerDelay: number = 50,
  options: KeyframeAnimationOptions = {}
) {
  const children = Array.from(container.children) as HTMLElement[];
  const animations: Animation[] = [];
  
  children.forEach((child, index) => {
    const delay = (options.delay as number || 0) + (index * staggerDelay);
    const animation = animationFn(child, { ...options, delay });
    animations.push(animation);
  });
  
  return animations;
}

/**
 * Generates CSS keyframes string and injects them into the document
 * Useful for pseudo-elements or React transitions where JS API is harder to apply
 */
export function generateKeyframes(name: string, frames: Record<string, Record<string, string>>): string {
  const styleId = 'mailops-animations';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  let cssText = `@keyframes ${name} {\n`;
  for (const [percent, properties] of Object.entries(frames)) {
    cssText += `  ${percent} {\n`;
    for (const [prop, value] of Object.entries(properties)) {
      // convert camelCase to kebab-case
      const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
      cssText += `    ${cssProp}: ${value};\n`;
    }
    cssText += `  }\n`;
  }
  cssText += `}\n`;
  
  // Check if it already exists to avoid duplicates
  if (!styleEl.textContent?.includes(`@keyframes ${name}`)) {
    styleEl.textContent += cssText;
  }
  
  return name;
}
