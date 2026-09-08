<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    primaryLabel: string
    secondaryLabel: string
    loading?: boolean
    disabled?: boolean
    menuDisabled?: boolean
    compact?: boolean
  }>(),
  {
    loading: false,
    disabled: false,
    menuDisabled: false,
    compact: false
  }
)

const emit = defineEmits<{
  (e: 'primary-click'): void
  (e: 'secondary-click'): void
}>()
</script>

<template>
  <v-btn-group :class="['split-action', { 'split-action--compact': props.compact }]" divided>
    <v-btn
      color="secondary"
      size="default"
      density="default"
      :loading="props.loading"
      :disabled="props.disabled"
      class="split-action__main"
      @click="emit('primary-click')"
    >
      {{ props.primaryLabel }}
    </v-btn>

    <v-menu location="top end" offset="6">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          color="secondary"
          variant="flat"
          size="default"
          density="default"
          icon="$dropdown"
          :disabled="props.menuDisabled || props.loading"
          class="split-action__menu"
        />
      </template>

      <v-list density="default" class="split-action__list">
        <v-list-item class="split-action__item" @click="emit('secondary-click')">
          <v-list-item-title>{{ props.secondaryLabel }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn-group>
</template>

<style scoped>


.split-action__main {
  min-width: 120px;
  border-radius: 0;
  text-transform: none;
}

.split-action__menu {
  min-width: 40px;
  padding-inline: 0;
  border-radius: 0;
}

.split-action__list {
  min-width: 160px;
}

.split-action__item {
  min-height: 36px;
}

.split-action--compact .split-action__main {
  min-width: 132px;
}

.split-action--compact .split-action__menu {
  min-width: 40px;
}

.split-action--compact .split-action__list {
  min-width: 120px;
}
</style>
