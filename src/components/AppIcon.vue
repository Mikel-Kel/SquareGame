<script setup lang="ts">
import Back from '@/assets/icons/back.svg?raw'
import Help from '@/assets/icons/help.svg?raw'
import Info from '@/assets/icons/info.svg?raw'
import Refresh from '@/assets/icons/refresh.svg?raw'
import Tool from '@/assets/icons/tool.svg?raw'
import Lightbulb from '@/assets/icons/lightbulb.svg?raw'
import Close from '@/assets/icons/close.svg?raw'

type IconName =
  | 'back'
  | 'help'
  | 'info'
  | 'refresh'
  | 'tool'
  | 'lightbulb'
  | 'close'

const props = defineProps<{
  name: IconName
  size?: number
}>()

const rawIcons: Record<IconName, string> = {
  back: Back,
  help: Help,
  info: Info,
  refresh: Refresh,
  tool: Tool,
  lightbulb: Lightbulb,
  close: Close
}

function cleanSvg(svg: string) {
  return svg
    .replace(/fill="[^"]*"/g, '')
    .replace(/stroke="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(
      '<svg',
      `<svg width="${props.size ?? 32}" height="${props.size ?? 32}" fill="currentColor"`
    )
}
</script>

<template>
  <span class="icon" v-html="cleanSvg(rawIcons[name])" />
</template>

<style scoped>
.icon {
  display: inline-flex;
  line-height: 0;
  color: inherit;
}
</style>