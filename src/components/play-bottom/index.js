import { mapState } from 'vuex'
import { getSongMp3 } from '@/server/searchMp3'
import { MessageBox } from 'mint-ui';
export default {
  data() {
    return {
      url: '',
      index: 0,
      buttonValue: '播放',
      bottom: '-1.5rem',
      songInfo: {
        imgUrl: ''
      },
      songListCache: {}  // 做一个缓存
    }
  },
  computed: {
    ...mapState(['songList', "hash"])
  },
  watch: {
    async hash() {
      this.index = !this.hash ? 0 : this.songList.findIndex(item => item.hash === this.hash);
      let error = await this.getSong();

      if (error === '无版权') {
        MessageBox('提示', '暂无版权播放');
        this.$refs.audio.pause();
        this.buttonValue = '播放'
      } else {
        this.bottom = 0;
      }
    }
  },
  methods: {
    playOrpause() {
      if (this.$refs.audio.paused) {
        this.$refs.audio.play();
        this.buttonValue = '暂停'
      } else {
        this.$refs.audio.pause();
        this.buttonValue = '播放'
      }

    },
    async getSong() {
      let item = this.songList[this.index];
      let data = null;

      if (this.songListCache[item.hash]) {
        data = this.songListCache[item.hash];
      } else {
        data = await getSongMp3({ hash: item.hash });
        data = data.data;
      }

      if (data.error === '') {
        this.url = data.url;
        this.songInfo = data;
        this.songListCache[item.hash] = data;
      } else {
        console.log(data.error)
      }

      return data.error;
    },
    async next() {
      // 边界处理
      ++this.index;  // 推到下一个歌曲
      if (this.index >= this.songList.length) {
        this.index = 0;
      }
      let error = await this.getSong();
      if (error === '无版权') {
        this.next();
      }

    },
    async prev() {
      // 边界处理
      --this.index;
      if (this.index < 0) {
        this.index = this.songList.length - 1;
      }
      let error = await this.getSong();
      if (error === '无版权') {
        this.prev();
      }
    }
  },
  mounted() {
    // 加载完成后播放
    this.$refs.audio.addEventListener('loadeddata', () => {
      this.$refs.audio.play();
      this.buttonValue = '暂停'
    })
  },
}