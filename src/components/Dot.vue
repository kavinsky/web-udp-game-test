<template>
    <div class="dot" :style="dotStyle">
        <span class="dot__crosshair" :style="backgroundStyle"></span>
        <span class="dot__name" :style="backgroundStyle">
            {{name}}
        </span>
    </div>
</template>

<script>
export default {
    name: 'Dot',
    props: {
        pos: Object,
        name: String,
        color: String
    },
    computed: {
        dotStyle () {
            return {
                top: `${this.pos.y - 5}px`,
                left: `${this.pos.x - 5}px`
            }
        },
        backgroundStyle () {
            return {
                background: `${this.color}`,
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.dot {
    position: fixed;

    &__crosshair {
        height: 10px;
        width: 10px;
        background: pink;
        border-radius: 50%;
        display: inline-block;
        position: absolute;
    }

    &__name {
        font-family: monospace;
        text-transform: uppercase;
        font-weight: bold;
        background: pink;
        color: white;
        padding: 2px;
        font-size: 0.6rem;
        position: absolute;
        top: 12px;
        left: 12px;
    }
}
</style>