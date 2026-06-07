<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { CarouselKey } from "./AppleCarouselContext";

interface Props {
  initialScroll?: number;
  itemCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialScroll: 0,
  itemCount: 0,
});

const carouselRef = ref<HTMLDivElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);
const currentIndex = ref(0);

onMounted(() => {
  if (carouselRef.value) {
    carouselRef.value.scrollLeft = props.initialScroll;
    checkScrollability();
  }
});

watch(
  () => props.initialScroll,
  (newVal) => {
    if (carouselRef.value) {
      carouselRef.value.scrollLeft = newVal;
      checkScrollability();
    }
  },
);

function checkScrollability() {
  if (carouselRef.value) {
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.value;
    canScrollLeft.value = scrollLeft > 0;
    canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1;
  }
}

function getScrollStep() {
  const firstItem = carouselRef.value?.querySelector<HTMLElement>(".apple-carousel-item");
  if (!firstItem) {
    return isMobile.value ? 188 : 268;
  }

  const nextItem = firstItem.nextElementSibling as HTMLElement | null;
  if (!nextItem) {
    return firstItem.getBoundingClientRect().width;
  }

  return nextItem.offsetLeft - firstItem.offsetLeft;
}

function scrollLeft() {
  if (carouselRef.value) {
    carouselRef.value.scrollBy({ left: -getScrollStep(), behavior: "smooth" });
  }
}

function scrollRight() {
  if (carouselRef.value) {
    carouselRef.value.scrollBy({ left: getScrollStep(), behavior: "smooth" });
  }
}

function handleCardClose(index: number) {
  if (carouselRef.value) {
    const step = getScrollStep();
    const scrollPosition = step * (index + 1);
    carouselRef.value.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });
    currentIndex.value = index;
  }
}

const isMobile = computed(() => {
  return window && window.innerWidth < 768;
});

const shouldCenterItems = computed(() => props.itemCount > 0 && props.itemCount <= 2);

provide(CarouselKey, {
  onCardClose: handleCardClose,
  currentIndex,
});
</script>

<template>
  <div class="relative w-full min-w-0 overflow-hidden">
    <div
      ref="carouselRef"
      class="flex w-full min-w-0 overflow-x-auto overscroll-x-auto scroll-smooth py-3 [scrollbar-width:none] md:py-6"
      @scroll="checkScrollability"
    >
      <div class="pointer-events-none absolute right-0 z-1000 h-full w-[5%] overflow-hidden bg-linear-to-l" />

      <div
        class="flex min-w-full flex-row gap-3 px-3"
        :class="shouldCenterItems ? 'justify-start md:justify-center' : 'justify-start'"
      >
        <slot />
      </div>
    </div>
    <div class="mr-10 flex justify-end gap-2">
      <button
        class="relative z-40 flex size-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
        :disabled="!canScrollLeft"
        @click="scrollLeft"
      >
        <Icon
          icon="tabler:arrow-narrow-left"
          class="size-6 text-gray-500"
        />
      </button>
      <button
        class="relative z-40 flex size-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
        :disabled="!canScrollRight"
        @click="scrollRight"
      >
        <Icon
          icon="tabler:arrow-narrow-right"
          class="size-6 text-gray-500"
        />
      </button>
    </div>
  </div>
</template>
