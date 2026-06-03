<script setup lang="ts">
import { Motion } from "motion-v";

interface Props {
  index: number;
  trailingSpace?: boolean;
}

withDefaults(defineProps<Props>(), {
  trailingSpace: true,
});
</script>

<template>
  <Motion
    as="div"
    :initial="{
      opacity: 0,
      y: 20,
    }"
    :animate="{
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.2 * index,
        ease: 'easeOut',
      },
    }"
    class="apple-carousel-item shrink-0 rounded-3xl"
    :class="trailingSpace ? 'last:pr-[5%] md:last:pr-[10%]' : ''"
  >
    <slot />
  </Motion>
</template>
