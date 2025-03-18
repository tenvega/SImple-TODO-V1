export const animations = {
  // Smooth slide in animation
  slideIn: (element, direction = 'right', duration = 300) => {
    element.style.opacity = '0';
    element.style.transform = direction === 'right' 
      ? 'translateX(20px)' 
      : 'translateX(-20px)';
    
    requestAnimationFrame(() => {
      element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
    });
  },

  // Smooth fade out animation
  fadeOut: (element, duration = 300) => {
    return new Promise(resolve => {
      element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      element.style.opacity = '0';
      element.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }
}; 