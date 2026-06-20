<script setup>
// Mascot/logo Devleap. size='sm' (header), 'lg' (hero), 'footer'.
defineProps({
  width: { type: Number, default: 44 },
  height: { type: Number, default: 47 },
  variant: { type: String, default: 'header' }, // header | hero | footer
  uid: { type: String, default: 'm' },
})
</script>

<template>
  <!-- HERO mascot (animated, detailed) -->
  <svg
    v-if="variant === 'hero'"
    :width="width"
    :height="height"
    viewBox="0 0 140 150"
    class="mascot-hero"
  >
    <defs>
      <linearGradient :id="`${uid}big`" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#36E6A4" />
        <stop offset="1" stop-color="#00A86F" />
      </linearGradient>
    </defs>
    <path d="M30 70 L41 16 L70 52 Z" :fill="`url(#${uid}big)`" />
    <path d="M110 70 L99 16 L70 52 Z" :fill="`url(#${uid}big)`" />
    <path d="M40 60 L45 28 L63 52 Z" fill="#FFD7C2" />
    <path d="M100 60 L95 28 L77 52 Z" fill="#FFD7C2" />
    <ellipse cx="70" cy="96" rx="52" ry="44" :fill="`url(#${uid}big)`" />
    <ellipse cx="70" cy="120" rx="28" ry="18" fill="#F3FFF8" />
    <ellipse cx="38" cy="108" rx="10" ry="6.5" fill="#FF9DAE" opacity=".6" />
    <ellipse cx="102" cy="108" rx="10" ry="6.5" fill="#FF9DAE" opacity=".6" />
    <ellipse cx="50" cy="95" rx="11.5" ry="14.5" fill="#fff" />
    <ellipse cx="90" cy="95" rx="11.5" ry="14.5" fill="#fff" />
    <ellipse cx="50" cy="96" rx="9.5" ry="12.5" fill="#2A1E33" />
    <ellipse cx="90" cy="96" rx="9.5" ry="12.5" fill="#2A1E33" />
    <circle cx="46" cy="90" r="3.6" fill="#fff" />
    <circle cx="86" cy="90" r="3.6" fill="#fff" />
    <circle cx="53" cy="100" r="1.9" fill="#fff" />
    <circle cx="93" cy="100" r="1.9" fill="#fff" />
    <path d="M64 105 Q70 110 76 105 Q70 113 64 105 Z" fill="#FF7C9B" />
    <path d="M124 40 l2.8 6.4 6.4 2.8 -6.4 2.8 -2.8 6.4 -2.8 -6.4 -6.4 -2.8 6.4 -2.8 z" fill="#FFB020" />
    <circle cx="15" cy="64" r="4" fill="#6C5CE7" />
  </svg>

  <!-- HEADER / FOOTER mascot (compact) -->
  <svg v-else :width="width" :height="height" viewBox="0 0 140 150">
    <defs>
      <linearGradient :id="`${uid}sm`" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#33E3A1" />
        <stop offset="1" stop-color="#00A86F" />
      </linearGradient>
    </defs>
    <path d="M28 74 L40 14 L73 54 Z" :fill="`url(#${uid}sm)`" />
    <path d="M112 74 L100 14 L67 54 Z" :fill="`url(#${uid}sm)`" />
    <path d="M40 62 L46 30 L64 53 Z" fill="#FFD7C2" />
    <path d="M100 62 L94 30 L76 53 Z" fill="#FFD7C2" />
    <ellipse cx="70" cy="95" rx="53" ry="45" :fill="`url(#${uid}sm)`" />
    <ellipse cx="70" cy="119" rx="25" ry="16" fill="#F3FFF8" />
    <ellipse cx="42" cy="110" rx="8" ry="5.5" fill="#FF9DAE" opacity=".55" />
    <ellipse cx="98" cy="110" rx="8" ry="5.5" fill="#FF9DAE" opacity=".55" />
    <ellipse cx="51" cy="93" rx="10.5" ry="13.5" fill="#26323B" />
    <ellipse cx="89" cy="93" rx="10.5" ry="13.5" fill="#26323B" />
    <circle cx="47" cy="88" r="3.3" fill="#fff" />
    <circle cx="85" cy="88" r="3.3" fill="#fff" />
    <circle cx="54" cy="97" r="1.7" fill="#fff" />
    <circle cx="92" cy="97" r="1.7" fill="#fff" />
    <path d="M66 110 Q70 114 74 110 Q70 116 66 110 Z" fill="#FF7C9B" />
  </svg>
</template>

<style scoped>
.mascot-hero {
  animation: floaty 5s ease-in-out infinite;
  filter: drop-shadow(0 24px 40px rgba(0, 168, 111, 0.28));
}
</style>
