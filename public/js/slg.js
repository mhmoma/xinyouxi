(function (global) {
  "use strict";

  var SLOTS = ["Morning", "Afternoon", "Evening", "LateNight"];
  var SLOT_CN = { Morning: "上午", Afternoon: "下午", Evening: "傍晚", LateNight: "深夜" };
  var DOW_CN = ["一", "二", "三", "四", "五", "六", "日"];
  var LOC_CN = {
    LivingRoom: "客厅",
    Kitchen: "厨房",
    Bedroom_Player: "次卧",
    Bedroom_NPC: "她的房",
    Bathroom: "浴室",
    Laundry: "洗衣",
    Entry: "玄关",
    Outside: "楼下"
  };
  var PLACE_ORDER = ["Bedroom_Player", "LivingRoom", "Kitchen", "Bathroom", "Laundry", "Bedroom_NPC", "Entry", "Outside"];
  var SAVE_KEY = "hezu_slg_v1";

  var tables = { rules: null, schedule: null, items: {}, talks: {}, actions: [], hotspots: {}, videos: [] };
  var state = null;
  var mode = "off";
  var lineQueue = [];
  var afterLines = null;
  var ui = {};
  var sheetKind = "";
  var currentCategory = "";
  var typeTimer = null;
  var typeFull = "";
  var pendingHeart = 0;
  var pendingLust = 0;
  var isNpcPanelRevealed = false;

  var BRANCHING_TALKS = {
    LivingRoom: {
      daily: [
        {
          id: "lr_daily_job",
          label: "聊聊商场的繁琐工作",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，今天商场站着累不累？看你回来小腿有点发红。”", char: "s1" },
            { speaker: "wanqing", text: "“哎，可别提了。今天化妆品柜台搞大促，站了整整九个小时。”", char: "e1" },
            { speaker: "wanqing", text: "“好几波客人围着试小样，连喝口水的时间都没有。一闲下来，脚底板疼得火辣辣的。”", char: "e2" },
            { speaker: "player", text: "“大促确实折腾人。你看上去精神都有些恍惚了。”", char: "e2" },
            { speaker: "wanqing", text: "“是啊，回到家看到这空空的客厅，正有些出神呢。不过，听你主动关心我，心里倒觉得没那么憋屈了。”", char: "s2", choices: [
              {
                text: "“我学过一点指压，要不帮你捏捏小腿？”",
                trust: 6,
                lust: 8,
                char: "e2",
                say: "“哎呀……你这孩子胡说什么呢。才租住几天呀，就动手动脚的。”",
                postLines: [
                  { speaker: "narration", text: "（她虽然嘴上推脱，人却顺从地靠在沙发靠背上，有些不好意思地并了并细致的双腿。）" },
                  { speaker: "wanqing", text: "“不过……如果你真会按的话，稍微、就稍微按一小会儿，可不许乱摸别的地方哦。”", char: "e5" },
                  { speaker: "narration", text: "（你坐过去，手掌托住她温热白皙的小腿肚，指尖缓缓揉按。她发出一声低低的哼声，领口因呼吸微微起伏。）" }
                ]
              },
              {
                text: "“站着辛苦了，吃晚饭了吗，我去热个面条？”",
                trust: 10,
                lust: 2,
                char: "s2",
                say: "“没呢……刚从柜台下班，累得胃都在抽抽，根本没力气开火了。”",
                postLines: [
                  { speaker: "narration", text: "（她有些虚弱地靠在沙发上，眼里闪烁着淡淡的亮光。）" },
                  { speaker: "wanqing", text: "“那就麻烦你啦，小陈。随便下个热汤面就行，卧个鸡蛋……有你在家等我，真好。”", char: "s3" },
                  { speaker: "narration", text: "（你起去厨房忙碌，林晚晴看着你的背影，嘴角挂着舒心的笑意。）" }
                ]
              }
            ]}
          ]
        },
        {
          id: "lr_daily_sound",
          label: "关于这栋楼的隔音",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，老房子的隔音不太好，我起夜是不是会吵到你？”", char: "s1" },
            { speaker: "wanqing", text: "“隔音啊……这栋楼确实是三十年的老房子了，墙壁薄得很。”", char: "s2" },
            { speaker: "wanqing", text: "“不过你不用太担心。我睡眠浅，但夜里偶尔听到隔壁有点动静，反倒觉得挺踏实的。”", char: "e1" },
            { speaker: "player", text: "“踏实？我还以为你会嫌我走路太重，吵着你休息呢。”", char: "s2" },
            { speaker: "wanqing", text: "“傻孩子。以前我一个人住，整间屋子静得像一潭死水，针掉地上都能听见。夜里下大雨，风吹着窗户响，我手心都是凉的。现在多了一个人，知道隔壁还有呼吸，心里就安稳多了。”", char: "s3", choices: [
              {
                text: "“我以后尽量放轻脚步，拖着拖鞋走。”",
                trust: 8,
                lust: 1,
                char: "s2",
                say: "“不用这么小心，没事的。你平时动静已经够轻了。”",
                postLines: [
                  { speaker: "narration", text: "（她换上舒适的拖鞋，温和地看着我，眼神里有一种长辈对晚辈、又带着一丝依恋的温柔。）" },
                  { speaker: "wanqing", text: "“要是真怕吵到我，以后夜里口渴出来倒水，你可以直接来我房里，门我一般不反锁的。”", char: "e1" },
                  { speaker: "narration", text: "（她突然顿了顿，发觉话里的不妥，脸颊微微泛红，低下头假装整理裙摆。）" }
                ]
              },
              {
                text: "“对，我也经常能听到林姐在客厅喝水的声音……”",
                trust: 5,
                lust: 7,
                char: "e1",
                say: "“朝……是吗？咳，那……那我以后起夜不穿拖鞋了。”",
                postLines: [
                  { speaker: "narration", text: "（她的脸颊瞬间爬上绯红，有些局促地交叠着双腿，细小的脚趾不安地在拖鞋里抠了抠。）" },
                  { speaker: "wanqing", text: "“真、真是不好意思，吵着你了……我以后尽量小声点。你……你没听到别的什么声音吧？”", char: "e2" },
                  { speaker: "narration", text: "（她有些心慌意乱地看着你，目光闪烁，成熟的气息在客厅昏暗的灯光下显得分外诱人。）" }
                ]
              }
            ]}
          ]
        }
      ],
      adult: [
        {
          id: "lr_adult_lonely",
          label: "聊起离婚后的寂寞生活",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐……你一个人住这么大的房子，夜里真的一点都不害怕吗？”", char: "e1" },
            { speaker: "wanqing", text: "“怕啊，怎么不怕。”", char: "e2" },
            { speaker: "wanqing", text: "“刚离婚那会儿，每天下班回到家，开门面对的都是一片漆黑。连个说话的人都没有。”", char: "e3" },
            { speaker: "wanqing", text: "“最怕的是生病，躺在床上连烧口热水的力气都没有，只能自己眼巴巴看着天花板。那一刻，真的觉得天都要塌了。”", char: "e3" },
            { speaker: "player", text: "“那样的日子听起来真难熬。不过现在，你不用一个人撑着了。”", char: "s1" },
            { speaker: "wanqing", text: "“是啊……小陈，自从你搬进来之后，屋子里有烟火气了。下班回来亮着的那盏小夜灯，对我真的很重要。”", char: "s3", choices: [
              {
                text: "“以后有我陪你，你不再是一个人了。”",
                trust: 12,
                lust: 8,
                char: "e3",
                say: "“你这孩子……海口夸得倒挺大。我都多大年纪了，你才刚进大学。不过……谢谢你。”",
                postLines: [
                  { speaker: "narration", text: "（虽然这么说着，但她看着我的目光闪烁，眼神里充满了感动与掩饰不住的欢喜。）" },
                  { speaker: "wanqing", text: "“不过……有你这句话，林姐心里真的很知足。只要你在这一天，我就觉得没那么孤单了。”", char: "s3" },
                  { speaker: "narration", text: "（她的指尖轻轻掠过我的手背，那一瞬间的热度，仿佛将两人的距离彻底拉近。）" }
                ]
              },
              {
                text: "“要是不习惯，我随时可以过来陪你聊天。”",
                trust: 8,
                lust: 12,
                char: "e4",
                say: "“……聊聊天还行。要是想胡闹……我可不依。”",
                postLines: [
                  { speaker: "narration", text: "（她拍了拍沙发的靠垫，指尖顺着沙发边缘缓缓划过，身子朝我的方向侧了侧。）" },
                  { speaker: "wanqing", text: "“要是哪天深夜你睡不着，就、就来我房间，我们聊聊天也挺好的……不准想别的哦。”", char: "e5" },
                  { speaker: "narration", text: "（她领口处露出的白皙肌肤在电视荧光的照耀下泛着温热的色泽，呼吸微促，欲望值暴增。）" }
                ]
              }
            ]}
          ]
        },
        {
          id: "lr_adult_scent",
          label: "赞美她身上成熟的香气",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐，你今天身上的柑橘香很好闻，有一种说不出的……成熟魅力。”", char: "e2" },
            { speaker: "wanqing", text: "“啊？柑橘香？有、有那么明显吗？”", char: "e1" },
            { speaker: "wanqing", text: "“这其实是商场柜台发的新款香水小样，我顺手在手腕上抹了一点。”", char: "s2" },
            { speaker: "player", text: "“不仅仅是香水，还有一种温热的体香，和这香气融在一起，特别好闻。”", char: "e5" },
            { speaker: "wanqing", text: "“越说越没个正经了……连林姐也敢编排。”", char: "e4" },
            { speaker: "wanqing", text: "“不过，真的有你说的那么……那么迷人吗？我都三十多岁了，平时站台，总觉得自己跟那些小年轻不能比了。”", char: "e2", choices: [
              {
                text: "“真想多闻一闻，像在梦里见过一样。”",
                trust: 6,
                lust: 15,
                char: "e5",
                say: "“别整天钻进这些没个正经的梦里。真是个坏小孩……”",
                postLines: [
                  { speaker: "narration", text: "（她耳尖瞬间通红，有些慌乱地伸手轻轻扯了扯低垂的衣领，但反而把修长的脖颈和锁骨暴露在我的视线下。）" },
                  { speaker: "wanqing", text: "“你……你离得这么近，呼吸都打在我脖子上了，热乎乎的，弄得我心慌……”", char: "e5" },
                  { speaker: "narration", text: "（她微微合上眼，身体不仅没有退开，反而软绵绵地朝我的方向倾斜，空气里满是她成熟的柑橘甜香。）" }
                ]
              },
              {
                text: "“它很衬你，有一种温厚而安定的感觉。”",
                trust: 12,
                lust: 5,
                char: "s3",
                say: "“呵呵，是吗？很久没人这么夸我了。”",
                postLines: [
                  { speaker: "narration", text: "（她弯起那双温柔如水的眼眸，深深地看着我，手指企图缠绕着耳边散落的一缕发丝。）" },
                  { speaker: "wanqing", text: "“既然你这么喜欢，那……那以后，我就天天用这个香水。只涂给你闻。”", char: "s3" },
                  { speaker: "narration", text: "（她嘴唇抿着，笑意里藏着浓浓的偏爱，对你的信赖值急剧攀升。）" }
                ]
              }
            ]}
          ]
        }
      ],
      intimate: [
        {
          id: "S3_living_tease",
          label: "S3·傍晚客厅试探·亲昵贴抱与身抚",
          energy: 15,
          trustMin: 30,
          lustMin: 10,
          action: function () {
            playVideoEvent("S3_living_tease", enterMap);
          }
        },
        {
          id: "S5_night_sofa",
          label: "S5·夜间客厅·沙发极乐口交",
          energy: 20,
          trustMin: 50,
          lustMin: 30,
          action: function () {
            playVideoEvent("S5_night_sofa", enterMap);
          }
        }
      ]
    },
    Kitchen: {
      daily: [
        {
          id: "ki_daily_help",
          label: "主动帮她洗菜切洋葱",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，洋葱辣眼睛，我来帮你切吧。我手稳。”", char: "s1" },
            { speaker: "wanqing", text: "“不用不用，小陈。我自己来就行，你回客厅看电视吧。”", char: "s2" },
            { speaker: "player", text: "“都流眼泪了还说不用呢。你看你，眼睛都红成兔子了。”", char: "e1" },
            { speaker: "wanqing", text: "“唔……这洋葱确实太辣了，直冲脑门。那……那好吧。刀在砧板上，你慢着点切，可别切着手。”", char: "e2", choices: [
              {
                text: "“你在一边歇着就行，我马上搞定。”",
                trust: 10,
                lust: 2,
                char: "s2",
                say: "“哎呀……你一伸手，我反倒不知道往哪站了。”",
                postLines: [
                  { speaker: "narration", text: "（厨房特别窄，她让开位置的时候，身体不得不紧贴着我的手臂 and 侧腹蹭过，传来温热潮湿的体温。）" },
                  { speaker: "wanqing", text: "“那……抹布在水槽左边，切完记得把刀面和砧板冲干净。辛苦你啦，小陈。”", char: "s3" },
                  { speaker: "narration", text: "（她站在一旁，轻轻用围裙擦着眼角的泪水，看着我熟练切洋葱的样子，眼神里闪过一丝异样的温暖。）" }
                ]
              },
              {
                text: "“切洋葱流眼泪，不知道的以为我欺负林姐呢。”",
                trust: 6,
                lust: 8,
                char: "e2",
                say: "“你这孩子……整天嘴里不饶人。谁能欺负得了我呀。”",
                postLines: [
                  { speaker: "narration", text: "（她佯装嗔怒地用手腕轻轻撞了我一下，眼里却全亮晶晶的，满是笑意。）" },
                  { speaker: "wanqing", text: "“既然这么会说话，那把那边的胡萝卜也削个皮。今天让你林姐也尝尝你的手艺。”", char: "e1" },
                  { speaker: "narration", text: "（说话时，她由于眼睛发辣，身体有些站不稳地靠在我肩膀上歇了几秒。成熟女性香甜的温热气息萦绕在鼻尖。）" }
                ]
              }
            ]}
          ]
        }
      ],
      adult: [
        {
          id: "ki_adult_apron",
          label: "聊起她围裙细腰的勒痕",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐，这围裙一勒，显得你腰特别细……而且前襟感觉有点紧。”", char: "e1" },
            { speaker: "wanqing", text: "“啊？你、你瞎盯着看什么呢……”", char: "e2" },
            { speaker: "wanqing", text: "“这围裙买了挺多年了，带子有点旧，我就系得紧了些。谁让你注意这些地方的，没大没小……”", char: "e1" },
            { speaker: "player", text: "“我只是说实话。林姐的身材，比我们学校很多小女生都要好看得多，穿着围裙特别贤惠。”", char: "e5" },
            { speaker: "wanqing", text: "“你……你这小家伙，嘴巴抹了蜜是不是。我都多大年纪了，哪能跟你们学校的年轻小姑娘比。”", char: "e5", choices: [
              {
                text: "“我真想帮你把后面的带子系紧一点。”",
                trust: 6,
                lust: 15,
                char: "e3",
                say: "“……你、你手给我老实点。正开着火呢，要是烫到了我可不管你。”",
                postLines: [
                  { speaker: "narration", text: "（她虽然这么说着，却还是轻轻停下了锅里的动作。耳尖瞬间变得红彤彤的，连脖颈都染上了一层粉红。）" },
                  { speaker: "wanqing", text: "“带子……在腰后面，你别趁机胡乱摸哦……坏孩子。”", char: "e5" },
                  { speaker: "narration", text: "（你伸手环过她细窄温热的腰肢，在后腰打了个漂亮的蝴蝶结。指尖隔着薄薄的衣物触碰到她温热的肌肤，她身体不自觉地软了一分，呼吸明显局促起来。）" }
                ]
              },
              {
                text: "“系得累不累？要不解开一会儿？”",
                trust: 8,
                lust: 12,
                char: "e4",
                say: "“解开衣服不就脏了嘛。真是的，脑子里整天想什么呢……”",
                postLines: [
                  { speaker: "narration", text: "（她红着脸白了我一眼，转过身去切土豆，但由于心慌，肩膀微微缩着，有些不自在地并了并脚踝。）" },
                  { speaker: "wanqing", text: "“去，洗个西红柿塞你嘴里。省得你整天在这说些让我面红耳赤的话。”", char: "e5" },
                  { speaker: "narration", text: "（她顺手拿了一个洗净的红西红柿塞到你嘴唇边，手指尖碰触到你的嘴唇，像触电般飞快地缩了回去，胸口剧烈起伏。）" }
                ]
              }
            ]}
          ]
        }
      ],
      intimate: [
        {
          id: "S4_kitchen_chores",
          label: "S4·厨房洗碗·身后抱与深吹",
          energy: 15,
          trustMin: 40,
          lustMin: 20,
          action: function () {
            playVideoEvent("S4_kitchen_chores", enterMap);
          }
        }
      ]
    },
    Bathroom: {
      daily: [
        {
          id: "ba_daily_pass",
          label: "路过递送洗净的干毛巾",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，洗脸毛巾我帮你挂地暖架上了。干干净净的。”", char: "s1" },
            { speaker: "wanqing", text: "“啊？啊，谢谢你啊小陈……我都忘了拿浴巾了。”", char: "e1" },
            { speaker: "wanqing", text: "“刚才洗头发水流太大，身上没擦干，正愁怎么出来呢。”", char: "e2" },
            { speaker: "player", text: "“不用客气，举手之劳。”", char: "s1" },
            { speaker: "wanqing", text: "“多亏有你在。以前我自己一个人，总是只能光着脚丫子湿漉漉地踩在地砖上跑出来拿……那瓷砖冷得很。”", char: "s3", choices: [
              {
                text: "“洗完直接拿就行，别光脚踩瓷砖冷。”",
                trust: 10,
                lust: 3,
                char: "s2",
                say: "“真贴心呀，小陈。像个小大人一样，还会照顾姐姐了。”",
                postLines: [
                  { speaker: "narration", text: "（她隔着磨砂玻璃门温柔地回应道。我能听到里面温热的水声渐渐变小，最后化为悉悉索索的擦拭声。）" },
                  { speaker: "wanqing", text: "“等我洗完出来，给你热杯纯牛奶。在浴室里蒸久了，头晕晕的，等会见哦。”", char: "s3" },
                  { speaker: "narration", text: "（透过白蒙蒙的门缝，隐约掠过她高挑白皙的曼妙身躯轮廓，让人忍不住心跳加速。）" }
                ]
              }
            ]}
          ]
        }
      ],
      adult: [
        {
          id: "ba_adult_door",
          label: "打趣说她洗澡时磨砂玻璃门没关严",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐……门其实有一道缝。要是楼道有人走过，说不定会反光。”", char: "e1" },
            { speaker: "wanqing", text: "“呀！真、真的假的啊？”", char: "sur1" },
            { speaker: "wanqing", text: "“这磨砂门锁怎么又松了……我明明记得拉严实了的。小陈，你……你可别胡看呀。”", char: "e1" },
            { speaker: "player", text: "“我是没看，但水雾里面透出来的轮廓……哪怕只是一点点，都非常漂亮。”", char: "e5" },
            { speaker: "wanqing", text: "“你、你这孩子！真是越活胆子越大了，连林姐都敢调戏了……”", char: "e5", choices: [
              {
                text: "“我站在门口帮你挡着，不让别人看见。”",
                trust: 8,
                lust: 8,
                char: "e4",
                say: "“……你挡着？我看最让人不放心的就是你。快回屋去，别在门口站着。”",
                postLines: [
                  { speaker: "narration", text: "（她娇嗔着喊道，但门里的脚步声却似乎移近了一分，在门板后面顿住了，并没有真的动怒。）" },
                  { speaker: "wanqing", text: "“你……要是真的在门口帮我守着，就不许乱看。等会姐姐洗完了……出来好好说说你。”", char: "e5" },
                  { speaker: "narration", text: "（门缝里冒出丝丝温热的香甜雾气，门后传来她扑通扑通的有些急促的呼吸声，暧昧的欲望感悄然升腾。）" }
                ]
              },
              {
                text: "“水雾里的轮廓……特别漂亮。”",
                trust: 3,
                lust: 18,
                char: "e5",
                say: "“……不准胡说！快闭嘴！真是羞死人了……”",
                postLines: [
                  { speaker: "narration", text: "（门板上传来她有些慌乱的轻拍声，以及扑通扑通的急促娇喘，水声在瞬间被她拧大，试图掩盖脸上的滚烫。）" },
                  { speaker: "wanqing", text: "“坏孩子……你再不走，姐姐明天就不给你做早饭了。快回去……脸都给你说红了。”", char: "e5" },
                  { speaker: "narration", text: "（她虽然羞不可耐地驱赶着，但声音里却带着令人销魂的颤音，欲望值几乎攀升到了顶点。）" }
                ]
              }
            ]}
          ]
        }
      ],
      intimate: [
        {
          id: "S7_bathroom_full",
          label: "S7·水汽浴室·全裸地砖抽插",
          energy: 20,
          trustMin: 80,
          lustMin: 60,
          action: function () {
            playVideoEvent("S7_bathroom_full", enterMap);
          }
        }
      ]
    },
    Bedroom_NPC: {
      daily: [
        {
          id: "br_daily_clock",
          label: "说说明早柜台晨会的闹钟",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，明早八点你不是要开盘库晨会吗？我七点叫你？”", char: "s1" },
            { speaker: "wanqing", text: "“啊……是吗？我都累得脑子转不动了，差点把晨会的事忘了。”", char: "e1" },
            { speaker: "wanqing", text: "“那个会特别烦，迟到两分钟店长就要在群里指名道姓地扣全勤……小陈，你明早真的能起来叫我吗？”", char: "e2" },
            { speaker: "player", text: "“放心吧。我定个七点的闹钟，洗漱完去敲你门板，保证不让你被扣钱。”", char: "s1" },
            { speaker: "wanqing", text: "“那可太好了……以前我都是一个人定五个闹钟，生怕睡过去。每晚都睡得提心胆战的。现在有人能叫我……感觉真的可以安心睡个好觉了。”", char: "s3", choices: [
              {
                text: "“怕你睡过头，商场扣全勤奖。”",
                trust: 12,
                lust: 1,
                char: "s2",
                say: "“你啊，小小年纪，想得比我还周到。真贴心。”",
                postLines: [
                  { speaker: "narration", text: "（她有些慵懒地躺在松软的床垫上，拉了防防调。看着我的眼里，溢出了满满的温柔与依赖。）" },
                  { speaker: "wanqing", text: "“小陈……谢谢你。有你同租，真的是我这段时间最幸运的一件事了。快回去睡吧，晚安。”", char: "s3" },
                  { speaker: "narration", text: "（她盖好被子，只露出一双温柔明亮的的眼睛看着你离开。）" }
                ]
              }
            ]}
          ]
        }
      ],
      adult: [
        {
          id: "br_adult_cold",
          label: "说起空调被有点单薄，被窝里有些发冷",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐……次卧空调开得有点大，我被窝里挺凉的。你这里暖和不暖和？”", char: "e1" },
            { speaker: "wanqing", text: "“冷吗？我房间的空调被确实也挺薄的……我也觉得今晚有点起风。”", char: "e1" },
            { speaker: "player", text: "“对啊，夜里温度降了。我那房间风直吹，手脚都是冰凉的。要不……”", char: "e2" },
            { speaker: "wanqing", text: "“要不什么呀……你这坏家伙，半夜站在姐姐房门口，是不是脑子里又在想些不老实的事呢？”", char: "e4", choices: [
              {
                text: "“要不，林姐帮我暖一暖？”",
                trust: 5,
                lust: 15,
                char: "e3",
                say: "“……你、你这小家伙，大半夜的，尽编这些拙劣的借口，就想着钻林姐被窝是不是？”",
                postLines: [
                  { speaker: "narration", text: "（她脸上浮现出浓浓 of 绯红与羞涩，娇嗔着用手捂了捂滚烫的脸颊。）" },
                  { speaker: "wanqing", text: "“真拿你没办法……进来可以，只准躺着，不准胡乱动手动脚啊……要是想胡闹，姐姐可真要把你赶出去了。”", char: "e5" },
                  { speaker: "narration", text: "（她微弱地朝旁边挪了挪身子，把空调薄被轻轻掀开一角，露出一半散发着成熟体香和沐浴露幽香的松软床铺，欲望值爆增。）" }
                ]
              },
              {
                text: "“那我帮你搓搓手吧。”",
                trust: 10,
                lust: 10,
                char: "e4",
                say: "“手……我手也是凉的。谁帮谁暖和啊……”",
                postLines: [
                  { speaker: "narration", text: "（她有些娇羞地小声嘟囔着，人却不由自主地把白皙温热的手掌伸出了被角，任由我握在手心轻轻抚摩。）" },
                  { speaker: "wanqing", text: "“小陈，你手掌好大、好暖和……那，那你就躺在床边，握着手呆一会好不好……卧室灯我已经拧到最暗了。”", char: "e5" },
                  { speaker: "narration", text: "（月光透过薄纱窗帘洒在她的枕畔，昏暗温暖的闺房里，成熟女性那含羞带怯的甜美娇喘让人近乎疯狂。）" }
                ]
              }
            ]}
          ]
        }
      ],
      intimate: [
        {
          id: "S5_nap_bedroom",
          label: "S5·周末午睡·偷香与含吹",
          energy: 15,
          trustMin: 60,
          lustMin: 40,
          action: function () {
            playVideoEvent("S5_nap_bedroom", enterMap);
          }
        },
        {
          id: "S9_bedroom_obsession",
          label: "S9·深夜虚掩·彻底沦陷之夜",
          energy: 20,
          trustMin: 95,
          lustMin: 85,
          action: function () {
            playVideoEvent("S9_bedroom_obsession", enterMap);
          }
        }
      ]
    },
    Laundry: {
      daily: [
        {
          id: "la_daily_sheet",
          label: "帮她拍打晾在风里的湿床单",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，床单太重了。我帮一同挂到高杆上，拍拍水。”", char: "s1" },
            { speaker: "wanqing", text: "“哎呀，谢谢你啊小陈。这棉麻床单吸了水确实沉得很，我一米六五的身高挂着还真有些吃力。”", char: "s2" },
            { speaker: "player", text: "“没事，有我呢。我来拽着那一头，你挂这头。”", char: "s1" },
            { speaker: "wanqing", text: "“好……使劲往上拉一点，别让它蹭到栏杆上的铁锈了。拍拍平整，干得才快。”", char: "s2", choices: [
              {
                text: "“晒干后会有好闻的阳光肥皂味。”",
                trust: 10,
                lust: 2,
                char: "s2",
                say: "“是呀，今晚你回次卧，就能用上洗得干干净净、带着阳光味道的暄腾腾被套了。”",
                postLines: [
                  { speaker: "narration", text: "（她偏过头，朝我展颜一笑。午后温暖的微风轻轻拂过，将她耳边散落的几缕柔顺发丝吹到我的面颊上，痒痒的，全是安心而迷人的幽香。）" },
                  { speaker: "wanqing", text: "“小陈，有你搭把手，做家务都变得有意思起来了。等洗完衣服，姐姐下厨给你做糖醋鱼吃。”", char: "s3" },
                  { speaker: "narration", text: "（你们在窄小的阳台上并肩站着，清爽的海浪般的洗衣粉芬芳包裹着彼此。）" }
                ]
              }
            ]}
          ]
        }
      ],
      adult: [
        {
          id: "la_adult_lingerie",
          label: "提到风里晾着的最里侧的蕾丝衣物",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐……最里角晾着的那个黑蕾丝贴身背心，好像被风吹歪了。”", char: "e1" },
            { speaker: "wanqing", text: "“啊？！你、你说什么？！”", char: "sur1" },
            { speaker: "wanqing", text: "“你这孩子……怎么连那个最里角的地方也盯着看，那、那是我的贴身衣服……”", char: "e1" },
            { speaker: "player", text: "“我只是顺便看了一眼，而且真的是歪了，挂钩快掉出来了。需要我帮你挂正，或者帮你收回来吗？”", char: "e2" },
            { speaker: "wanqing", text: "“不要！绝对不准你碰！真是要羞死人了，快把头转过去，听见没有……”", char: "e2", choices: [
              {
                text: "“需要我帮你挂正吗？”",
                trust: 5,
                lust: 15,
                char: "e4",
                say: "“你！不准乱动，更不准帮我收那个。真是一天到晚就你古怪点子多……”",
                postLines: [
                  { speaker: "narration", text: "（她踩了我一脚，红着脸慌慌张张地扑过去，一把将那薄如蝉翼、散发着幽香的黑蕾丝紧紧搂在怀里，藏在宽大的被套后面，急促地喘着气。）" },
                  { speaker: "wanqing", text: "“小家伙，眼睛再乱看，姐姐可真要生气了……那衣服、那是内衣……你一个小男生，怎么能碰呢，真是坏死了……”", char: "e5" },
                  { speaker: "narration", text: "（她双手抱胸，娇躯由于极度羞怯而微微颤抖着，红晕从脸蛋一直蔓延到了白嫩的脖颈根部，欲望值极速拉满。）" }
                ]
              }
            ]}
          ]
        }
      ],
      intimate: [
        {
          id: "S6_laundry_rear",
          label: "S6·狭小洗衣房·紧贴后入",
          energy: 20,
          trustMin: 70,
          lustMin: 50,
          action: function () {
            playVideoEvent("S6_laundry_rear", enterMap);
          }
        }
      ]
    },
    Entry: {
      daily: [
        {
          id: "en_daily_view",
          label: "在天台风口一起看云卷云舒",
          energy: 10,
          dialogue: [
            { speaker: "player", text: "“林姐，天台视野真开阔。阳光真暖和。”", char: "s1" },
            { speaker: "wanqing", text: "“是啊小陈，平时屋里关久了，上来吹吹风真舒服。”", char: "s2" }
          ]
        }
      ],
      adult: [
        {
          id: "en_adult_dress",
          label: "聊聊风把连衣裙吹得贴在腿上",
          energy: 15,
          dialogue: [
            { speaker: "player", text: "“林姐，风把裙子吹紧了……身材真好。”", char: "e1" },
            { speaker: "wanqing", text: "“你这坏孩子，又在瞎看些什么呢。”", char: "e2" }
          ]
        }
      ],
      intimate: [
        {
          id: "S8_rooftop_day",
          label: "S8·晴空天台·晾衣姿势链",
          energy: 20,
          trustMin: 85,
          lustMin: 70,
          action: function () {
            playVideoEvent("S8_rooftop_day", enterMap);
          }
        },
        {
          id: "S8_rooftop_night",
          label: "S8·星空天台·露天深吹与后入",
          energy: 20,
          trustMin: 90,
          lustMin: 80,
          action: function () {
            playVideoEvent("S8_rooftop_night", enterMap);
          }
        }
      ]
    }
  };

  var NPC_KEYS = {
    LivingRoom: ["chat_polite", "chat_close", "chores", "gift", "touch", "further"],
    Kitchen: ["chat_kit", "chores_kit"],
    Bathroom: ["eavesdrop", "passby"],
    Bedroom_NPC: ["hnight"]
  };
  var NPC_ICON = {
    chat_polite: "💬",
    chat_close: "💬",
    chat_kit: "💬",
    chores: "🧹",
    chores_kit: "🧹",
    gift: "🎁",
    touch: "✋",
    further: "🔥",
    eavesdrop: "👂",
    passby: "🚶",
    hnight: "🌙"
  };
  var STATE_CN = { Idle: "空闲", Busy: "忙碌", Bathing: "洗澡中", Sleeping: "睡觉中" };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n | 0));
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }

  function loadTables() {
    return Promise.all([
      fetchJson("data/slg/rules.json?v=2"),
      fetchJson("data/slg/schedule.json?v=2"),
      fetchJson("data/slg/items.json?v=1"),
      fetchJson("data/slg/talks.json?v=2"),
      fetchJson("data/slg/actions.json?v=2"),
      fetchJson("data/slg/hotspots.json?v=2"),
      fetchJson("data/slg/videos.json?v=1").catch(function () { return []; })
    ]).then(function (pack) {
      tables.rules = pack[0];
      tables.schedule = pack[1];
      tables.items = pack[2];
      tables.talks = pack[3];
      tables.actions = pack[4];
      tables.hotspots = pack[5] || {};
      tables.videos = pack[6] || [];
      if (pack[0].slots) SLOTS = pack[0].slots;
      if (pack[0].slotCn) SLOT_CN = pack[0].slotCn;
    });
  }

  function dow(s) {
    return (s.dayCount + 4) % 7;
  }

  function isWeekend(s) {
    return dow(s) >= 5;
  }

  function nightish(slot) {
    return slot === "Evening" || slot === "LateNight";
  }

  function bgFor(loc, slot) {
    var night = nightish(slot);
    if (loc === "LivingRoom") return night ? "living_night" : "living_day";
    if (loc === "Kitchen") return night ? "kitchen_night" : "kitchen_day";
    if (loc === "Bedroom_Player") return night ? "player_room_night" : "player_room_day";
    if (loc === "Bedroom_NPC") return night ? "her_room_night" : "her_room_day";
    if (loc === "Bathroom") return night ? "bath_night" : "bath";
    if (loc === "Laundry") return night ? "laundry_night" : "laundry_day";
    if (loc === "Entry") return night ? "entry_night" : "entry_day";
    if (loc === "Outside") return night ? "street_night" : "street_day";
    return "black";
  }

  function bandOf(trust) {
    var bands = (tables.rules && tables.rules.trustBands) || [];
    var i;
    for (i = 0; i < bands.length; i++) {
      if (trust >= bands[i].min && trust <= bands[i].max) return bands[i];
    }
    return bands[bands.length - 1] || { label: "房客", hint: "" };
  }

  function defaultState() {
    var st = tables.rules && tables.rules.start ? tables.rules.start : {};
    return {
      dayCount: st.dayCount || 1,
      currentTimeSlot: st.currentTimeSlot || "Afternoon",
      playerGold: st.playerGold != null ? st.playerGold : 1000,
      playerEnergy: st.playerEnergy != null ? st.playerEnergy : 100,
      playerAcademic: st.playerAcademic != null ? st.playerAcademic : 50,
      playerMood: st.playerMood != null ? st.playerMood : 50,
      playerLocation: st.playerLocation || "Bedroom_Player",
      eventFlags: { MoveIn_Done: true },
      inventory: [],
      cameraInstalled: false,
      currentStage: "S0",
      unlockedStages: ["S0"],
      wanqing: {
        trust: 10,
        lust: 5,
        suspicion: 0,
        currentLocation: "LivingRoom",
        currentState: "Idle",
        stats: { mouth: 0, hand: 0, foot: 0, vaginal: 0, anal: 0, climax: 0 }
      },
      unlockedVideos: [],
      eveningBath: false
    };
  }

  function weightedPick(list) {
    var sum = 0;
    var i;
    for (i = 0; i < list.length; i++) sum += list[i].w || 1;
    var r = Math.random() * sum;
    for (i = 0; i < list.length; i++) {
      r -= list[i].w || 1;
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function applySchedule(s, reason) {
    var sch = tables.schedule || {};
    var npc = s.wanqing;
    var slot = s.currentTimeSlot;
    if (reason === "boot" && s.dayCount === 1 && slot === "Afternoon") {
      npc.currentLocation = "LivingRoom";
      npc.currentState = "Idle";
      return;
    }
    if (slot === "Evening" && s.eveningBath) {
      npc.currentLocation = "Bathroom";
      npc.currentState = "Bathing";
      return;
    }
    var table = isWeekend(s) ? sch.weekend : sch.weekday;
    var rows = table && table[slot];
    if (!rows) {
      npc.currentLocation = "LivingRoom";
      npc.currentState = "Idle";
      return;
    }
    if (!Array.isArray(rows)) {
      npc.currentLocation = rows.location || "LivingRoom";
      npc.currentState = rows.state || "Idle";
      return;
    }
    var pickRow = weightedPick(rows);
    npc.currentLocation = pickRow.location;
    npc.currentState = pickRow.state;
  }

  function maybeWander(s, playerNow) {
    var stt = s.wanqing.currentState;
    if (stt === "Sleeping" || stt === "Bathing") return;
    if (s.wanqing.currentLocation === "Outside") return;
    if (s.wanqing.currentLocation === playerNow) return;
    var p = tables.schedule && tables.schedule.wanderWhenPlayerMoves;
    if (p == null) p = 0.42;
    if (Math.random() < p) applySchedule(s, "wander");
  }

  function npcHere(s) {
    var n = s.wanqing;
    return n.currentLocation === s.playerLocation && n.currentLocation !== "Outside";
  }

  function portraitFor(s) {
    if (!npcHere(s)) return "none";
    var stt = s.wanqing.currentState;
    if (stt === "Sleeping" || stt === "Bathing") return "none";
    if (stt === "Busy") return "a2";
    if (s.wanqing.trust >= 91) return "s3";
    if (s.wanqing.trust >= 60) return "s2";
    return "s1";
  }

  function enterSlot(s, slot, rolled) {
    s.currentTimeSlot = slot;
    var chance = tables.schedule && tables.schedule.eveningBathChance;
    if (chance == null) chance = 0.2;
    if (slot === "Evening" && !rolled) s.eveningBath = Math.random() < chance;
    if (slot !== "Evening") s.eveningBath = false;
    applySchedule(s);
  }

  function spend(s, energy, slots) {
    if (energy && s.playerEnergy < energy) return "没劲了。先回去躺会儿。";
    if (energy) s.playerEnergy = clamp(s.playerEnergy - energy, 0, 100);
    if (slots) s._spentSlot = true;
    return "";
  }

  function pick(arr) {
    if (!arr || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickTalk(s, key) {
    var arr = tables.talks && tables.talks[key];
    if (!arr || !arr.length) return "";
    if (!s._lastTalk) s._lastTalk = {};
    var last = s._lastTalk[key];
    var pool = arr.filter(function (t) {
      return t !== last;
    });
    if (!pool.length) pool = arr;
    var t = pick(pool);
    s._lastTalk[key] = t;
    return t;
  }

  function flag(s, k) {
    return !!(s.eventFlags && s.eventFlags[k]);
  }

  function setFlag(s, k, v) {
    if (!s.eventFlags) s.eventFlags = {};
    s.eventFlags[k] = v !== false;
  }

  function hasItem(s, id) {
    return s.inventory.indexOf(id) >= 0;
  }

  function takeItem(s, id) {
    var i = s.inventory.indexOf(id);
    if (i < 0) return false;
    s.inventory.splice(i, 1);
    return true;
  }

  function giftIds(s) {
    return s.inventory.filter(function (id) {
      var it = tables.items[id];
      return it && it.trust && !it.equip;
    });
  }

  function needOk(def, s) {
    var npc = s.wanqing;
    var here = npcHere(s);
    var need = def.need || "always";
    if (def.trustMin != null && npc.trust < def.trustMin) return false;
    if (def.trustMax != null && npc.trust > def.trustMax) return false;
    if (need === "always") return true;
    if (need === "npc_here") {
      return here && npc.currentState !== "Sleeping" && npc.currentState !== "Bathing";
    }
    if (need === "npc_here_trust_lt_30") {
      return here && npc.trust < 30 && npc.currentState !== "Sleeping" && npc.currentState !== "Bathing";
    }
    if (need === "npc_here_trust_gte_30") {
      return here && npc.trust >= 30 && npc.currentState !== "Sleeping" && npc.currentState !== "Bathing";
    }
    if (need === "npc_busy_trust_gte_20") {
      return here && npc.currentState === "Busy" && npc.trust >= 20;
    }
    if (need === "npc_idle_trust_gte_60") {
      return here && npc.currentState === "Idle" && npc.trust >= 60;
    }
    if (need === "npc_idle_trust_gte_91") {
      return here && npc.currentState === "Idle" && npc.trust >= 91 && npc.lust >= ((tables.rules.lustUnlock && tables.rules.lustUnlock.further) || 40);
    }
    if (need === "has_gift") return giftIds(s).length > 0 && here && npc.currentState !== "Sleeping";
    if (need === "has_camera_uninstalled") return hasItem(s, "camera") && !s.cameraInstalled;
    if (need === "npc_not_bathing") return npc.currentState !== "Bathing" || npc.currentLocation !== "Bathroom";
    if (need === "npc_bathing") return npc.currentState === "Bathing" && npc.currentLocation === "Bathroom";
    if (need === "fall_lust_night") {
      return (
        s.currentTimeSlot === "LateNight" &&
        npc.trust >= 91 &&
        npc.lust >= ((tables.rules.lustUnlock && tables.rules.lustUnlock.hNight) || 55) &&
        npc.currentLocation === "Bedroom_NPC"
      );
    }
    return false;
  }

  function mandatoryLines(s) {
    var rent = tables.rules && tables.rules.rent ? tables.rules.rent : { dayMod: 30, amount: 2000 };
    if (s.dayCount > 1 && s.dayCount % rent.dayMod === 1 && s.currentTimeSlot === "Morning") {
      if (s.playerGold >= rent.amount) {
        s.playerGold -= rent.amount;
        return [{ speaker: "wanqing", char: "s1", text: "房租。微信转就行。备注写房租两个字。" }];
      }
      setFlag(s, "BadEnd_Rent", true);
      return [
        { speaker: "wanqing", char: "a2", text: "这个月……算了。你收拾东西吧。押金我转你。" },
        { speaker: "narration", text: "（桌上只剩一副碗。钥匙她收回去了。）" }
      ];
    }
    return null;
  }

  function warnSuspicion(s) {
    var warn = (tables.rules && tables.rules.suspicionWarn) || 80;
    if (s.wanqing.suspicion >= warn && !flag(s, "Suspicion_Warn")) {
      setFlag(s, "Suspicion_Warn", true);
      return [{ speaker: "wanqing", char: "a2", text: "你最近老在门口停。我不是瞎的。收敛点。" }];
    }
    if (s.wanqing.suspicion < warn - 10) setFlag(s, "Suspicion_Warn", false);
    return null;
  }

  function conditionalLines(s) {
    var t = s.wanqing.trust;
    var w = warnSuspicion(s);
    if (w) return w;
    if (t >= 91 && !flag(s, "Trust91_Event_Played") && npcHere(s)) {
      setFlag(s, "Trust91_Event_Played", true);
      return [
        { speaker: "wanqing", char: "e1", text: "门……今晚不锁。你别误会。我就是怕你倒水撞门。" },
        { speaker: "wanqing", char: "s1", text: "当我没说。" }
      ];
    }
    if (t >= 61 && !flag(s, "Trust61_Event_Played") && npcHere(s)) {
      setFlag(s, "Trust61_Event_Played", true);
      return [{ speaker: "wanqing", char: "s1", text: "你要是靠过来，我会愣一下。不是允许。是没躲开。" }];
    }
    if (t >= 50 && !flag(s, "Trust50_Event_Played") && npcHere(s) && s.wanqing.currentState === "Idle") {
      setFlag(s, "Trust50_Event_Played", true);
      return [
        { speaker: "wanqing", char: "e1", text: "那个。……你在这儿住，我其实没那么不习惯。" },
        { speaker: "wanqing", char: "s1", text: "当我没说。你去做你的。" }
      ];
    }
    if (t >= 30 && !flag(s, "Trust30_Event_Played") && npcHere(s)) {
      setFlag(s, "Trust30_Event_Played", true);
      return [
        { speaker: "wanqing", char: "s1", text: "以后别老叫姐。在这屋子里，叫晚晴就行。" },
        { speaker: "player", text: "……好。" }
      ];
    }
    return null;
  }

  function isDailyDone(s, key) {
    if (!s) return false;
    if (!s.dailyDone) s.dailyDone = {};
    return !!s.dailyDone[s.dayCount + "_" + key];
  }

  function markDailyDone(s, key) {
    if (!s) return;
    if (!s.dailyDone) s.dailyDone = {};
    s.dailyDone[s.dayCount + "_" + key] = true;
    persist();
  }

  function onEnterLines(s, fromLoc) {
    if (s.playerLocation === "Bathroom" && s.wanqing.currentState === "Bathing" && s.wanqing.currentLocation === "Bathroom") {
      if (!flag(s, "Bath_WalkIn_" + s.dayCount)) {
        setFlag(s, "Bath_WalkIn_" + s.dayCount, true);
        s.wanqing.suspicion = clamp(s.wanqing.suspicion + 8, 0, 100);
        s.wanqing.lust = clamp(s.wanqing.lust + 3, 0, 100);
        return [
          { speaker: "wanqing", char: "sur1", text: "你——门没锁你不知道吗。出去。" },
          { speaker: "player", text: "我不是故意的。" }
        ];
      }
    }
    if (s.playerLocation === "Bedroom_NPC" && s.wanqing.currentState === "Sleeping" && s.wanqing.trust < 91) {
      s.playerLocation = fromLoc || "LivingRoom";
      return [{ speaker: "narration", text: "（门从里面锁着。没声。）" }];
    }
    return null;
  }

  function nightProcess(s) {
    var decay = (tables.rules && tables.rules.suspicionDecay) || 5;
    s.wanqing.suspicion = clamp(s.wanqing.suspicion - decay, 0, 100);
    s.playerEnergy = 100;
    s.dayCount += 1;
    s.eveningBath = false;
    s.dailyDone = {};
    enterSlot(s, "Morning", true);
    s.playerLocation = "Bedroom_Player";
  }

  function actionsFor(s) {
    return (tables.actions || []).filter(function (a) {
      return a.loc === s.playerLocation && needOk(a, s);
    });
  }

  function fail(msg) {
    return [{ speaker: "narration", text: "（" + msg + "）" }];
  }

  function applyNums(s, def) {
    var npc = s.wanqing;
    if (def.trust) npc.trust = clamp(npc.trust + def.trust, 0, 100);
    if (def.lust) npc.lust = clamp(npc.lust + def.lust, 0, 100);
    if (def.suspicion) npc.suspicion = clamp(npc.suspicion + def.suspicion, 0, 100);
    if (def.academic) s.playerAcademic = clamp(s.playerAcademic + def.academic, 0, 100);
    if (def.gold) s.playerGold += def.gold;
    if (def.mood) s.playerMood = clamp(s.playerMood + def.mood, 0, 100);
    if (def.energyGain) s.playerEnergy = clamp(s.playerEnergy + def.energyGain, 0, 100);
  }

  function execAction(s, id, extra) {
    var def = null;
    var i;
    for (i = 0; i < tables.actions.length; i++) {
      if (tables.actions[i].id === id) def = tables.actions[i];
    }
    var lines = [];
    s._spentSlot = false;
    var err;
    var npc = s.wanqing;

    if (id === "buy") {
      var item = tables.items[extra];
      if (!item || !item.shop) return fail("店里没这号。");
      if (s.playerGold < item.price) return fail("钱不够。");
      s.playerGold -= item.price;
      s.inventory.push(item.id);
      return [{ speaker: "narration", text: "（下单了" + item.name + "。" + (item.text || "") + "）" }];
    }
    if (id === "sns") {
      return [{ speaker: "narration", text: "（" + pick(tables.talks.sns) + "）" }];
    }
    if (id === "monitor") {
      err = spend(s, 10, 0);
      if (err) return fail(err);
      if (!s.cameraInstalled) return fail("没装过。");
      if (npc.currentState === "Bathing") {
        npc.lust = clamp(npc.lust + 8, 0, 100);
        return [{ speaker: "narration", text: "（画面里雾气很重。她背对着镜头洗头。我看了十几秒就划掉。）" }];
      }
      if (npc.currentState === "Sleeping") {
        npc.lust = clamp(npc.lust + 2, 0, 100);
        return [{ speaker: "narration", text: "（浴室黑着。隔壁她房里偶尔有翻身的声音，镜头拍不到。）" }];
      }
      return [{ speaker: "narration", text: "（浴室空的。水龙头滴了一下。）" }];
    }
    if (id === "gift_item") {
      var g = tables.items[extra];
      if (!g || !takeItem(s, extra)) return fail("包里没这个。");
      applyNums(s, { trust: g.trust || 0, lust: g.lust || 0 });
      return [{ speaker: "wanqing", char: "s1", text: "买这干嘛。……放桌上吧。我待会看。" }];
    }

    if (!def) return fail("没这回事。");
    if (def.special !== "sleep" && def.special !== "phone" && def.special !== "gift") {
      err = spend(s, def.energy || 0, def.slots || 0);
      if (err) return fail(err);
    }

    if (def.special === "sleep") {
      return [
        {
          speaker: "narration",
          text: "（窗外微风摇曳，躺在松软温热的床上……你要选择如何度过？）",
          choices: [
            {
              text: "🛌 在床上舒舒服服小憩午睡 (恢复 30 体力，跳过当前时段)",
              action: function() {
                triggerTimeTransition("🛌 床上小憩", "午后微风，短憩惬意", function() {
                  s.playerEnergy = clamp(s.playerEnergy + 30, 0, 100);
                  s._spentSlot = true;
                  var how = advanceSlotIfNeeded();
                  var nextSlotCn = SLOT_CN[s.currentTimeSlot];
                  playLines([
                    { speaker: "narration", text: "（你定了个短闹钟，在床上舒舒服服地睡了个午觉。体力恢复了！）" },
                    { speaker: "narration", text: "（一眨眼，时间来到了 " + nextSlotCn + "。）" }
                  ], enterMap);
                });
              }
            },
            {
              text: "💤 闭上眼睛沉沉深睡到明天清晨 (精力恢复 100%，天数 +1)",
              action: function() {
                triggerTimeTransition("🌙 闭眼深睡", "夜深人静，朝阳再起", function() {
                  s.playerEnergy = 100;
                  nightProcess(s);
                  playLines([
                    { speaker: "narration", text: "（一觉醒来。阳光洒在枕畔。新的一天，第 " + s.dayCount + " 天！）" }
                  ], enterMap);
                });
              }
            },
            {
              text: "🔑 悄悄溜去隔壁晚晴卧室看看 (需信赖 ≥ 50)",
              action: function() {
                if (s.wanqing.trust < 50) {
                  playLines([
                    { speaker: "narration", text: "（信赖值不足 50，尚不敢深夜敲门溜进她卧室。）" }
                  ], enterMap);
                  return;
                }
                var vid = s.wanqing.trust >= 90 ? "S9_bedroom_obsession" : "S5_nap_bedroom";
                playVideoEvent(vid, enterMap);
              }
            },
            {
              text: "💭 躺在床头静静遐想温存 (恢复 10 体力，欲望 +2)",
              action: function() {
                s.playerEnergy = clamp(s.playerEnergy + 10, 0, 100);
                s.wanqing.lust = clamp((s.wanqing.lust || 0) + 2, 0, 100);
                playLines([
                  { speaker: "narration", text: "（你枕着手臂望着天花板，脑海里全是对走廊那头晚晴的思念与温存遐想……）" }
                ], enterMap);
              }
            }
          ]
        }
      ];
    }
    if (def.special === "phone") {
      openSheet("phone");
      return [];
    }
    if (def.special === "gift") {
      openSheet("gift");
      return [];
    }
    if (def.special === "touch") {
      var aList = (tables.videos || []).filter(function (v) {
        return v.tier === "A" && !v.isGalleryVariant && (s.wanqing.trust >= (v.trustMin || 30));
      });
      if (aList.length) {
        var pickA = aList[Math.floor(Math.random() * aList.length)];
        window.setTimeout(function () {
          playVideoEvent(pickA.id, enterMap);
        }, 50);
        return [];
      }
      if (Math.random() < 0.55 + npc.lust / 400) {
        npc.lust = clamp(npc.lust + 2, 0, 100);
        lines.push({ speaker: "wanqing", char: "e1", text: "……手拿开。我没说你可以。" });
      } else {
        npc.trust = clamp(npc.trust - 5, 0, 100);
        lines.push({ speaker: "wanqing", char: "a2", text: "你干什么。我是你姐。" });
      }
    } else if (def.special === "further") {
      var pickVid = null;
      if (s.playerLocation === "LivingRoom") {
        pickVid = "blowjob_living";
      } else if (s.playerLocation === "Kitchen") {
        pickVid = "blowjob_kitchen";
      } else {
        var bList = (tables.videos || []).filter(function (v) {
          return (v.tier === "B" || v.tier === "C") && !v.isGalleryVariant && s.wanqing.trust >= 70;
        });
        if (bList.length) {
          pickVid = bList[Math.floor(Math.random() * bList.length)].id;
        }
      }
      if (pickVid) {
        window.setTimeout(function () {
          playVideoEvent(pickVid, enterMap);
        }, 50);
        return [];
      }
      npc.lust = clamp(npc.lust + 6, 0, 100);
      npc.trust = clamp(npc.trust + 2, 0, 100);
      lines.push({ speaker: "wanqing", char: "e1", text: "灯……灯开着。你要是现在停，我明天当没有。" });
      lines.push({ speaker: "narration", text: "（她没把我推开。呼吸就在领口那。）" });
    } else if (def.special === "hnight") {
      var pickD = (s.wanqing.trust >= 95 && s.wanqing.lust >= 75) ? "bed_intimate" :
                  (s.wanqing.trust >= 90 && s.wanqing.lust >= 60) ? "bed_kneel" : "blowjob_sleep";
      window.setTimeout(function () {
        playVideoEvent(pickD, enterMap);
      }, 50);
      return [];
    } else if (id === "chores_kit" && s.wanqing.trust >= 40 && Math.random() < 0.75) {
      window.setTimeout(function () {
        playVideoEvent("touch_kitchen_breast", enterMap);
      }, 50);
      return [];
    } else if ((id === "eavesdrop" || id === "passby") && s.wanqing.trust >= 80 && Math.random() < 0.6) {
      var bathVid = s.wanqing.lust >= 60 ? "insert_bath_nude" : "insert_bath_dressed";
      window.setTimeout(function () {
        playVideoEvent(bathVid, enterMap);
      }, 50);
      return [];
    } else if ((id === "laundry" || id === "chat_laundry") && s.wanqing.trust >= 80 && s.currentTimeSlot === "Afternoon" && Math.random() < 0.6) {
      window.setTimeout(function () {
        playVideoEvent("insert_laundry", enterMap);
      }, 50);
      return [];
    } else if (def.special === "install_cam") {
      if (!takeItem(s, "camera")) return fail("包里没有摄像头。");
      s.cameraInstalled = true;
      lines.push({ speaker: "narration", text: "（我把它贴在浴室换气扇边上。手一直抖。）" });
    } else {
      applyNums(s, def);
      if (def.talk && tables.talks[def.talk]) {
        lines.push({ speaker: "wanqing", char: "s1", text: pickTalk(s, def.talk) });
      } else if (def.say) {
        lines.push({ speaker: "wanqing", char: "s1", text: def.say });
      } else if (def.log) {
        lines.push({ speaker: "narration", text: "（" + def.log + "）" });
      }
    }

    var extraL = conditionalLines(s);
    if (extraL) lines = lines.concat(extraL);
    return lines;
  }

  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
    try {
      if (window.dzmm && dzmm.kv && dzmm.kv.put) dzmm.kv.put(SAVE_KEY, JSON.stringify(state), { flush: true });
    } catch (e2) {}
  }

  function readSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function hasSave() {
    var s = readSave();
    return !!(s && s.eventFlags && s.eventFlags.MoveIn_Done && !s.eventFlags.BadEnd_Rent);
  }

  function paintStage() {
    if (!window.Stage || !state) return;
    Stage.applyBeat({
      bg: bgFor(state.playerLocation, state.currentTimeSlot),
      char: portraitFor(state),
      dim: true
    });
  }

  var STAGES_CONFIG = [
    {
      id: "S0",
      title: "S0·住下次卧，听完规矩",
      goal: "住下次卧，听完规矩",
      desc: "刚刚搬进次卧，听完晚晴交代的日常合租规矩，熟悉同居环境。",
      dayMin: 1,
      trustMin: 0,
      lustMin: 0,
      target: "在快速移动中选择【客厅】或【厨房】找晚晴打招呼"
    },
    {
      id: "S1",
      title: "S1·三次正常相处",
      goal: "三次正常相处（吃饭/闲聊/打招呼）",
      desc: "通过日常打招呼、吃饭与闲聊，打破彼此间的生疏与防备。",
      dayMin: 1,
      trustMin: 10,
      lustMin: 0,
      target: "与晚晴完成 3 次日常聊天或打招呼（信赖 10 以上）"
    },
    {
      id: "S2",
      title: "S2·修缮与帮帮忙",
      goal: "修一次或帮一次忙",
      desc: "帮晚晴修理电饭煲或家电，让她对你展现心扉，解锁【🌹 成人话题】。",
      dayMin: 1,
      trustMin: 20,
      lustMin: 0,
      target: "帮做一次家务或送礼（信赖 20 以上）"
    },
    {
      id: "S3",
      title: "S3·傍晚客厅试探",
      goal: "傍晚客厅选靠近，不要先回房",
      desc: "傍晚在客厅看电视时靠近她，从身后抱住并试探揉抚。",
      dayMin: 1,
      trustMin: 30,
      lustMin: 10,
      target: "傍晚在客厅选择【S3·傍晚客厅试探】（信赖 30，欲望 10）"
    },
    {
      id: "S4",
      title: "S4·厨房忙碌与洗碗深吹",
      goal: "她在厨房忙碌时从后面抱/洗碗事件",
      desc: "在她洗碗时从身后贴抱，解锁厨房深吹极乐。",
      dayMin: 2,
      trustMin: 40,
      lustMin: 20,
      target: "下午在厨房选择【S4·厨房洗碗与深吹】（信赖 40，欲望 20）"
    },
    {
      id: "S5_night",
      title: "S5·夜间客厅沙发极乐",
      goal: "夜·客厅，她找你说过话",
      desc: "深夜客厅微光中，在沙发旁享受她顺从的吹吐。",
      dayMin: 2,
      trustMin: 50,
      lustMin: 30,
      target: "夜间在客厅选择【S5·夜间客厅沙发极乐】（信赖 50，欲望 30）"
    },
    {
      id: "S5_nap",
      title: "S5·周末午睡偷香",
      goal: "周末午睡，她房门未锁",
      desc: "周末午后她房门未锁，潜入闺房进行探寻与含吹。",
      dayMin: 2,
      trustMin: 60,
      lustMin: 40,
      target: "午后去晚晴卧室选择【S5·周末午睡偷香】（信赖 60，欲望 40）"
    },
    {
      id: "S6",
      title: "S6·狭小洗衣房后入",
      goal: "洗衣房碰到她，选关门",
      desc: "在狭小的洗衣房拉上拉门，压在洗衣机上后入。",
      dayMin: 3,
      trustMin: 70,
      lustMin: 50,
      target: "在洗衣房选择【S6·狭小洗衣房后入】（信赖 70，欲望 50）"
    },
    {
      id: "S7",
      title: "S7·水汽浴室全裸地砖",
      goal: "她洗澡，送衣服进门",
      desc: "趁她洗澡送衣服推门，在水汽氤氲中享受全裸地砖极乐。",
      dayMin: 3,
      trustMin: 80,
      lustMin: 60,
      target: "在浴室选择【S7·水汽浴室全裸地砖】（信赖 80，欲望 60）"
    },
    {
      id: "S8_day",
      title: "S8·晴空天台晾衣姿势链",
      goal: "天台晾衣服",
      desc: "晴空万里的天台晾衣架旁，进行多姿势连续抽插。",
      dayMin: 4,
      trustMin: 85,
      lustMin: 70,
      target: "在天台选择【S8·晴空天台晾衣姿势链】（信赖 85，欲望 70）"
    },
    {
      id: "S8_night",
      title: "S8·星空天台露天狂欢",
      goal: "夜里天台叫你上去",
      desc: "夜深人静的天台风口，露天吹吐与美妙后入。",
      dayMin: 4,
      trustMin: 90,
      lustMin: 80,
      target: "夜间在天台选择【S8·星空天台露天狂欢】（信赖 90，欲望 80）"
    },
    {
      id: "S9",
      title: "S9·深夜门虚掩·彻底沦陷",
      goal: "深夜她房门虚掩，选进去",
      desc: "深夜她房门故意留了一缝，彻底为你沦陷，享受终极同居欢愉。",
      dayMin: 4,
      trustMin: 95,
      lustMin: 85,
      target: "深夜在晚晴卧室选择【S9·深夜门虚掩·彻底沦陷】（信赖 95，欲望 85）"
    }
  ];

  function evaluateStage(s) {
    if (!s) return "S0";
    if (!s.unlockedStages) s.unlockedStages = ["S0"];
    
    var trust = s.wanqing ? (s.wanqing.trust || 0) : 0;
    var lust = s.wanqing ? (s.wanqing.lust || 0) : 0;
    var day = s.dayCount || 1;

    var highestUnlocked = "S0";

    for (var i = 0; i < STAGES_CONFIG.length; i++) {
      var cfg = STAGES_CONFIG[i];
      if (trust >= cfg.trustMin && lust >= cfg.lustMin && day >= cfg.dayMin) {
        highestUnlocked = cfg.id;
        if (s.unlockedStages.indexOf(cfg.id) < 0) {
          s.unlockedStages.push(cfg.id);
        }
      }
    }

    s.currentStage = highestUnlocked;
    return highestUnlocked;
  }

  function getCurrentQuest(s) {
    if (!s) return { title: "无任务", desc: "", target: "" };
    var activeStageId = evaluateStage(s);
    var cfg = null;
    for (var i = 0; i < STAGES_CONFIG.length; i++) {
      if (STAGES_CONFIG[i].id === activeStageId) {
        cfg = STAGES_CONFIG[i];
        break;
      }
    }
    if (!cfg) cfg = STAGES_CONFIG[0];

    return {
      title: cfg.title,
      desc: cfg.desc,
      target: cfg.target + " (信赖: " + (s.wanqing.trust || 0) + " · 欲望: " + (s.wanqing.lust || 0) + ")"
    };
  }

  function paintHud() {
    var night = nightish(state.currentTimeSlot);
    if (ui.clock) {
      ui.clock.textContent = night ? "☾" : "☀";
      ui.clock.classList.toggle("is-night", night);
    }
    if (ui.time) {
      ui.time.textContent = "第" + state.dayCount + "天 · 周" + DOW_CN[dow(state)] + " · " + SLOT_CN[state.currentTimeSlot];
    }
    if (ui.energyFill) ui.energyFill.style.width = clamp(state.playerEnergy, 0, 100) + "%";
    if (ui.energyNum) ui.energyNum.textContent = state.playerEnergy + "/100";
    if (ui.gold) ui.gold.textContent = "¥ " + state.playerGold;
    if (ui.study) ui.study.textContent = "Lv." + state.playerAcademic;

    var qTitle = document.getElementById("hud-quest-title");
    var qDesc = document.getElementById("hud-quest-desc");
    var qTarget = document.getElementById("hud-quest-target");
    if (qTitle && state) {
      var q = getCurrentQuest(state);
      qTitle.textContent = q.title;
      if (qDesc) qDesc.textContent = q.desc;
      if (qTarget) qTarget.textContent = "目标: " + q.target;
    }
  }

  function actionById(id) {
    var i;
    for (i = 0; i < tables.actions.length; i++) {
      if (tables.actions[i].id === id) return tables.actions[i];
    }
    return null;
  }

  function setGameClass(name, on) {
    var root = document.getElementById("screen-game");
    if (!root) return;
    root.classList.toggle(name, !!on);
  }

  var IntimacyStatsManager = {
    getStats: function () {
      if (!state || !state.wanqing) return { mouth: 0, hand: 0, foot: 0, vaginal: 0, anal: 0, climax: 0 };
      if (!state.wanqing.stats) {
        state.wanqing.stats = { mouth: 0, hand: 0, foot: 0, vaginal: 0, anal: 0, climax: 0 };
      }
      return state.wanqing.stats;
    },

    increment: function (category, amount) {
      if (!category) return;
      amount = amount || 1;
      var st = IntimacyStatsManager.getStats();
      st[category] = Math.max(0, (st[category] || 0) + amount);
      persist();
      IntimacyStatsManager.refreshUI();
    },

    recordAction: function (vidDef, actionTier) {
      if (!vidDef) return;
      var tier = actionTier || vidDef.tier;
      var vidId = vidDef.id || "";

      if (tier === "A") {
        IntimacyStatsManager.increment("hand", 1);
      } else if (tier === "B") {
        IntimacyStatsManager.increment("mouth", 1);
      } else if (tier === "C" || tier === "D") {
        if (vidId.indexOf("anal") >= 0) {
          IntimacyStatsManager.increment("anal", 1);
        } else if (vidId.indexOf("foot") >= 0) {
          IntimacyStatsManager.increment("foot", 1);
        } else {
          IntimacyStatsManager.increment("vaginal", 1);
        }
        IntimacyStatsManager.increment("climax", 1);
      }
    },

    refreshUI: function () {
      var st = IntimacyStatsManager.getStats();

      // Top Right Profile Overlay Card Counters
      var cMouth = document.getElementById("stat-count-mouth");
      var cHand = document.getElementById("stat-count-hand");
      var cFoot = document.getElementById("stat-count-foot");
      var cVaginal = document.getElementById("stat-count-vaginal");
      var cAnal = document.getElementById("stat-count-anal");
      var cClimax = document.getElementById("stat-count-climax");

      if (cMouth) cMouth.textContent = st.mouth || 0;
      if (cHand) cHand.textContent = st.hand || 0;
      if (cFoot) cFoot.textContent = st.foot || 0;
      if (cVaginal) cVaginal.textContent = st.vaginal || 0;
      if (cAnal) cAnal.textContent = st.anal || 0;
      if (cClimax) cClimax.textContent = st.climax || 0;

      // iPad Stats Panel (#ipad-stats-body)
      var ipadBody = document.getElementById("ipad-stats-body");
      if (ipadBody) {
        ipadBody.innerHTML = "<div class='stats-card-box'>" +
          "<h3>📊 肢体与亲密维度全精确统计</h3>" +
          "<div class='stats-bar-item'><span>👄 口交/唇舌次数: <b>" + (st.mouth || 0) + "</b> 次</span></div>" +
          "<div class='stats-bar-item'><span>✋ 亲抚/手交次数: <b>" + (st.hand || 0) + "</b> 次</span></div>" +
          "<div class='stats-bar-item'><span>🦶 足交/踩弄次数: <b>" + (st.foot || 0) + "</b> 次</span></div>" +
          "<div class='stats-bar-item'><span>🌸 穴交/插入次数: <b>" + (st.vaginal || 0) + "</b> 次</span></div>" +
          "<div class='stats-bar-item'><span>🍑 肛交/后庭次数: <b>" + (st.anal || 0) + "</b> 次</span></div>" +
          "<div class='stats-bar-item'><span>💦 潮喷/高潮次数: <b>" + (st.climax || 0) + "</b> 次</span></div>" +
          "</div>";
      }
    }
  };

  function ensureStats(s) {
    IntimacyStatsManager.getStats();
  }

  function renderNpcPanel() {
    if (!ui.npcPanel || !ui.npcActs) return;
    var here = npcHere(state);
    var actsOverlay = document.querySelector(".actions-floating-overlay");
    
    // Profile card is ALWAYS on when Wanqing is present in the room!
    if (!here) {
      ui.npcPanel.classList.remove("is-on");
    } else {
      ui.npcPanel.classList.add("is-on");
    }

    // Actions overlay is ONLY on when clicking her sprite!
    if (actsOverlay) {
      if (here && isNpcPanelRevealed) {
        actsOverlay.classList.add("is-on");
      } else {
        actsOverlay.classList.remove("is-on");
      }
    }

    if (!here) return;

    var st = STATE_CN[state.wanqing.currentState] || state.wanqing.currentState;
    if (ui.npcState) ui.npcState.textContent = st;
    if (ui.npcFace) ui.npcFace.src = "assets/char/wanqing/" + (portraitFor(state) === "none" ? "s1.png" : portraitFor(state) + ".png");
    
    var b = bandOf(state.wanqing.trust);
    if (ui.heartFill) ui.heartFill.style.width = clamp(state.wanqing.trust, 0, 100) + "%";
    if (ui.lustFill) ui.lustFill.style.width = clamp(state.wanqing.lust || 0, 0, 100) + "%";
    
    var suspFill = document.getElementById("npc-suspicion-fill");
    if (suspFill) suspFill.style.width = clamp(state.wanqing.suspicion || 0, 0, 100) + "%";

    if (ui.npcRel) {
      ui.npcRel.textContent = "关系：" + b.label + " · " + (b.id === "tenant" ? "疏离" : b.id === "roommate" ? "熟稔" : b.id === "depend" ? "亲密" : "沦陷");
    }

    // Update Intimacy Counters (口、手、足、穴、肛、高潮)
    ensureStats(state);
    var stats = state.wanqing.stats;
    var cMouth = document.getElementById("stat-count-mouth");
    var cHand = document.getElementById("stat-count-hand");
    var cFoot = document.getElementById("stat-count-foot");
    var cVaginal = document.getElementById("stat-count-vaginal");
    var cAnal = document.getElementById("stat-count-anal");
    var cClimax = document.getElementById("stat-count-climax");

    if (cMouth) cMouth.textContent = stats.mouth || 0;
    if (cHand) cHand.textContent = stats.hand || 0;
    if (cFoot) cFoot.textContent = stats.foot || 0;
    if (cVaginal) cVaginal.textContent = stats.vaginal || 0;
    if (cAnal) cAnal.textContent = stats.anal || 0;
    if (cClimax) cClimax.textContent = stats.climax || 0;

    ui.npcActs.innerHTML = "";

    var loc = state.playerLocation;
    var talks = BRANCHING_TALKS[loc] || BRANCHING_TALKS.LivingRoom; // fallback if room not defined

    if (currentCategory === "") {
      // Main Category Menu: Daily, Adult, Intimate, Chores/Gifts
      
      // 1. Daily Dialogue
      var btnDaily = document.createElement("button");
      btnDaily.type = "button";
      btnDaily.className = "npc-act-category";
      btnDaily.innerHTML = "<span>💬 日常对话</span><span class='category-arrow'>➔</span>";
      btnDaily.addEventListener("click", function (ev) {
        ev.stopPropagation();
        currentCategory = "daily";
        renderNpcPanel();
      });
      ui.npcActs.appendChild(btnDaily);

      // 2. Adult Topics (unlocked at trust >= 30)
      var btnAdult = document.createElement("button");
      btnAdult.type = "button";
      var adultUnlocked = state.wanqing.trust >= 30;
      btnAdult.className = "npc-act-category" + (adultUnlocked ? "" : " is-locked");
      btnAdult.disabled = !adultUnlocked;
      btnAdult.innerHTML = "<span>🌹 成人话题</span>" + (adultUnlocked ? "<span class='category-arrow'>➔</span>" : "<span class='lock'>🔒 (信赖30解锁)</span>");
      btnAdult.addEventListener("click", function (ev) {
        ev.stopPropagation();
        currentCategory = "adult";
        renderNpcPanel();
      });
      ui.npcActs.appendChild(btnAdult);

      // 3. Intimate Advances (unlocked at trust >= 60)
      var btnIntimate = document.createElement("button");
      btnIntimate.type = "button";
      var intimateUnlocked = state.wanqing.trust >= 60;
      btnIntimate.className = "npc-act-category" + (intimateUnlocked ? "" : " is-locked");
      btnIntimate.disabled = !intimateUnlocked;
      btnIntimate.innerHTML = "<span>🔥 直入正题</span>" + (intimateUnlocked ? "<span class='category-arrow'>➔</span>" : "<span class='lock'>🔒 (信赖60解锁)</span>");
      btnIntimate.addEventListener("click", function (ev) {
        ev.stopPropagation();
        currentCategory = "intimate";
        renderNpcPanel();
      });
      ui.npcActs.appendChild(btnIntimate);

      // 4. House Chores & Gifts
      var btnChores = document.createElement("button");
      btnChores.type = "button";
      btnChores.className = "npc-act-category";
      btnChores.innerHTML = "<span>🧹 家务与送礼</span><span class='category-arrow'>➔</span>";
      btnChores.addEventListener("click", function (ev) {
        ev.stopPropagation();
        currentCategory = "chores";
        renderNpcPanel();
      });
      ui.npcActs.appendChild(btnChores);

    } else {
      // Submenu: render a back button and specific choices
      var btnBack = document.createElement("button");
      btnBack.type = "button";
      btnBack.className = "npc-act npc-act-back";
      btnBack.innerHTML = "<span>⬅ 返回主菜单</span>";
      btnBack.addEventListener("click", function (ev) {
        ev.stopPropagation();
        currentCategory = "";
        renderNpcPanel();
      });
      ui.npcActs.appendChild(btnBack);

      if (currentCategory === "daily" || currentCategory === "adult" || currentCategory === "intimate") {
        var subItems = talks[currentCategory] || [];
        subItems.forEach(function (item) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "npc-act";
          
          var energyLow = item.energy && state.playerEnergy < item.energy;
          var trustOk = !item.trustMin || state.wanqing.trust >= item.trustMin;
          var lustOk = !item.lustMin || state.wanqing.lust >= item.lustMin;
          var isUnlocked = trustOk && lustOk;

          btn.disabled = energyLow || !isUnlocked;
          
          var costStr = item.energy ? "-" + item.energy + "体力" : "";
          var labelSpan = "<span>" + item.label + "</span>";
          
          if (!isUnlocked) {
            var reqs = [];
            if (!trustOk) reqs.push("信赖" + item.trustMin);
            if (!lustOk) reqs.push("欲望" + item.lustMin);
            btn.innerHTML = labelSpan + "<span class='lock'>🔒 (" + reqs.join(",") + ")</span>";
          } else {
            btn.innerHTML = labelSpan + (energyLow ? "<span class='cost' style='color:#e74c3c'>体力不足</span>" : "<span class='cost'>" + costStr + "</span>");
          }

          btn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            isNpcPanelRevealed = true;
            var talkFlag = "talked_" + item.id + "_" + state.dayCount;
            if (flag(state, talkFlag)) {
              playLines([
                { speaker: "wanqing", char: "e1", text: "已经聊过这个话题了，我们今天聊点别的吧。" }
              ], enterMap);
              return;
            }
            setFlag(state, talkFlag, true);

            if (item.energy) state.playerEnergy = clamp(state.playerEnergy - item.energy, 0, 100);
            
            // Branching conversations do NOT advance the time slot!
            currentCategory = "";
            renderNpcPanel();

            if (item.action) {
              item.action();
            } else if (item.dialogue) {
              var linesToPlay = Array.isArray(item.dialogue) ? item.dialogue : [item.dialogue];
              playLines(linesToPlay, enterMap);
            }
          });
          ui.npcActs.appendChild(btn);
        });
      } else if (currentCategory === "chores") {
        // 1. Gift giving option (always available if player has gifts in inventory)
        var hasGifts = giftIds(state).length > 0;
        var btnGift = document.createElement("button");
        btnGift.type = "button";
        btnGift.className = "npc-act";
        btnGift.disabled = !hasGifts;
        btnGift.innerHTML = "<span>🎁 赠送礼品</span>" + (hasGifts ? "<span class='cost'>从背包赠送</span>" : "<span class='lock'>🔒 (包里暂无礼品)</span>");
        btnGift.addEventListener("click", function (ev) {
          ev.stopPropagation();
          openSheet("gift");
        });
        ui.npcActs.appendChild(btnGift);

        // 2. Mini-game Cooking option in Kitchen
        if (state.playerLocation === "Kitchen") {
          var btnMini = document.createElement("button");
          btnMini.type = "button";
          btnMini.className = "npc-act";
          btnMini.innerHTML = "<span>🍳 亲自下厨特调与做菜 (心动小游戏)</span><span class='cost'>-20体力</span>";
          btnMini.addEventListener("click", function (ev) {
            ev.stopPropagation();
            openMinigameModal();
          });
          ui.npcActs.appendChild(btnMini);
        }

        // 3. Location Chores list (unrestricted, available anytime)
        var choresList = [
          { id: "chores_living", loc: "LivingRoom", label: "🧹 打扫客厅与擦拭茶几", energy: 20, trustGain: 5, goldGain: 50 },
          { id: "chores_kit", loc: "Kitchen", label: "🍳 洗碗备餐与整理洗菜池", energy: 20, trustGain: 6, goldGain: 60 },
          { id: "chores_laundry", loc: "Laundry", label: "🧺 帮晚晴晾晒棉麻被单", energy: 20, trustGain: 6, lustGain: 2 },
          { id: "chores_bath", loc: "Bathroom", label: "🧽 擦拭浴室水槽与瓷砖", energy: 20, trustGain: 6, lustGain: 3 },
          { id: "chores_bedroom", loc: "Bedroom_NPC", label: "🔧 检修闺房台灯与家电", energy: 25, trustGain: 10, lustGain: 5 },
          { id: "chores_massage", loc: "LivingRoom", label: "💆 为晚晴舒缓肩颈按摩", energy: 20, trustMin: 50, trustGain: 10, lustGain: 8 }
        ];

        var roomChores = choresList.filter(function (c) {
          return c.loc === state.playerLocation || c.loc === "LivingRoom";
        });

        roomChores.forEach(function (c) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "npc-act";
          var energyLow = state.playerEnergy < c.energy;
          var trustOk = !c.trustMin || state.wanqing.trust >= c.trustMin;

          btn.disabled = energyLow || !trustOk;

          if (!trustOk) {
            btn.innerHTML = "<span>" + c.label + "</span><span class='lock'>🔒 (信赖" + c.trustMin + "解锁)</span>";
          } else {
            btn.innerHTML = "<span>" + c.label + "</span>" + (energyLow ? "<span class='cost' style='color:#e74c3c'>体力不足</span>" : "<span class='cost'>-" + c.energy + "体力</span>");
          }

          btn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            isNpcPanelRevealed = true;
            state.playerEnergy = clamp(state.playerEnergy - c.energy, 0, 100);

            triggerTimeTransition("🧹 勤劳家务 · 手道勤抚", "屋舍清香，晚晴眼神温柔", function () {
              if (c.trustGain) state.wanqing.trust = clamp(state.wanqing.trust + c.trustGain, 0, 100);
              if (c.lustGain) state.wanqing.lust = clamp((state.wanqing.lust || 0) + c.lustGain, 0, 100);
              if (c.goldGain) state.playerGold += c.goldGain;
              paintHud();
              persist();
              popHeart(c.trustGain || 2, c.lustGain || 0);

              playLines([
                { speaker: "wanqing", char: "s3", text: "“小陈，辛苦你啦！有你帮着做家务，家里一下子亮堂了许多呢。”" }
              ], enterMap);
            });
          });

          ui.npcActs.appendChild(btn);
        });
      }
    }
  }

  function renderHotspots() {
    if (!ui.hot) return;
    ui.hot.innerHTML = "";
    var list = (tables.hotspots && tables.hotspots[state.playerLocation]) || [];
    list.forEach(function (h) {
      var def = actionById(h.id);
      if (!def || !needOk(def, state)) return;
      var el = document.createElement("div");
      el.className = "hot-spot";
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      el.setAttribute("aria-label", h.label);
      el.style.left = h.left + "%";
      el.style.top = h.top + "%";
      el.style.width = h.w + "%";
      el.style.height = h.h + "%";
      el.innerHTML = "<span class=\"hot-tip\">" + (h.icon || "") + " " + h.label + "</span>";
      function goHot(ev) {
        ev.stopPropagation();
        InteractionManager.triggerInteraction(h.id);
      }
      el.addEventListener("click", goHot);
      el.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          goHot(ev);
        }
      });
      ui.hot.appendChild(el);
    });
  }

  function sStateShortLabel(st) {
    if (st === "Bathing") return "(洗澡中)";
    if (st === "Sleeping") return "(睡觉中)";
    if (st === "Busy") return "(忙碌中)";
    return "(空闲)";
  }

  function renderMiniMap() {
    if (!ui.mapGrid) return;
    ui.mapGrid.innerHTML = "";

    var roomIcons = {
      Kitchen: "🍳",
      Laundry: "🧺",
      Bathroom: "🛁",
      LivingRoom: "🛋️",
      Bedroom_NPC: "🚪",
      Bedroom_Player: "🛏️",
      Entry: "🚪",
      Outside: "🚶"
    };

    PLACE_ORDER.forEach(function (id) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mmap-room mmap-room-" + id;

      var isPlayerHere = id === state.playerLocation;
      var isNpcHere = state.wanqing.currentLocation === id && id !== "Outside";

      if (isPlayerHere) b.classList.add("is-here");
      if (isNpcHere) b.classList.add("is-npc");

      var content = "<div class='mmap-room-header'>";
      content += "<span class='mmap-room-icon'>" + (roomIcons[id] || "•") + "</span>";
      content += "<span class='mmap-room-name'>" + LOC_CN[id] + "</span>";
      content += "</div>";

      content += "<div class='mmap-room-indicators'>";
      if (isPlayerHere) {
        content += "<span class='mmap-indicator is-player'>📍 你在此处</span>";
      }
      if (isNpcHere) {
        var stateLabel = sStateShortLabel(state.wanqing.currentState);
        content += "<span class='mmap-indicator is-npc'>🌸 晚晴 " + stateLabel + "</span>";
      }
      content += "</div>";

      b.innerHTML = content;

      b.addEventListener("click", function () {
        if (ui.mapBox) ui.mapBox.classList.add("hidden");
        goPlace(id);
      });

      ui.mapGrid.appendChild(b);
    });
  }

  function hideSheet() {
    sheetKind = "";
    if (ui.sheet) ui.sheet.classList.add("hidden");
    if (ui.sheetBody) ui.sheetBody.innerHTML = "";
  }

  function openSheet(kind) {
    sheetKind = kind;
    if (!ui.sheet || !ui.sheetBody || !ui.sheetTitle) return;
    ui.sheet.classList.remove("hidden");
    ui.sheetBody.innerHTML = "";
    function addBtn(label, fn, dis) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--time";
      b.textContent = label;
      if (dis) b.disabled = true;
      b.addEventListener("click", fn);
      ui.sheetBody.appendChild(b);
    }
    if (kind === "phone") {
      ui.sheetTitle.textContent = "手机";
      addBtn("网购", function () {
        openSheet("shop");
      });
      addBtn("回忆画廊", function () {
        hideSheet();
        openGallery("all");
      });
      addBtn(
        "查看监控",
        function () {
          hideSheet();
          playLines(execAction(state, "monitor"), enterMap);
        },
        !state.cameraInstalled
      );
      addBtn("社交网络", function () {
        hideSheet();
        playLines(execAction(state, "sns"), enterMap);
      });
    } else if (kind === "shop") {
      ui.sheetTitle.textContent = "网购";
      Object.keys(tables.items).forEach(function (k) {
        var it = tables.items[k];
        if (!it.shop) return;
        addBtn(
          it.name + " · " + it.price,
          function () {
            hideSheet();
            playLines(execAction(state, "buy", it.id), enterMap);
          },
          state.playerGold < it.price
        );
      });
    } else if (kind === "gift") {
      ui.sheetTitle.textContent = "送礼";
      giftIds(state).forEach(function (id) {
        var it = tables.items[id];
        addBtn(it.name, function () {
          hideSheet();
          var t0 = state.wanqing.trust;
          var lines = execAction(state, "gift_item", id);
          playLines(lines, enterMap, state.wanqing.trust - t0);
        });
      });
    }
    addBtn("返回", function () {
      if (kind === "shop") openSheet("phone");
      else hideSheet();
    });
  }

  function popHeart(t, l) {
    if (!ui.fxHeart) return;
    var parts = [];
    if (t && t > 0) parts.push("❤ 信赖 +" + t);
    if (l && l > 0) parts.push("🔥 欲望 +" + l);
    if (parts.length === 0) return;

    ui.fxHeart.hidden = false;
    ui.fxHeart.innerHTML = parts.join(" | ");
    ui.fxHeart.classList.add("is-on");
    window.setTimeout(function () {
      ui.fxHeart.classList.remove("is-on");
      ui.fxHeart.hidden = true;
    }, 1200);
  }

  function clearType() {
    if (typeTimer) {
      window.clearInterval(typeTimer);
      typeTimer = null;
    }
  }

  function setTalking(on) {
    mode = on ? "talk" : "map";
    setGameClass("is-talk", on);
    if (ui.hint) {
      ui.hint.hidden = !on;
      ui.hint.textContent = on ? "点这里继续" : "";
    }
    if (on && ui.npcPanel) ui.npcPanel.classList.remove("is-on");
    if (on && ui.hot) ui.hot.innerHTML = "";
    if (on && ui.mapBox) ui.mapBox.classList.add("hidden");
  }

  function showLine(line) {
    if (ui.name) ui.name.textContent = line.speaker === "wanqing" ? "晚晴" : "";
    typeFull = line.text || "";
    if (ui.text) ui.text.textContent = "";
    if (line.char && window.Stage) Stage.setChar(line.char);
    else if (line.speaker === "player" && window.Stage) Stage.setChar("player_talk");
    var i = 0;
    clearType();
    if (ui.choices) ui.choices.innerHTML = "";

    typeTimer = window.setInterval(function () {
      i += 1;
      if (ui.text) ui.text.textContent = typeFull.slice(0, i);
      if (i >= typeFull.length) {
        clearType();
        if (pendingHeart || pendingLust) {
          popHeart(pendingHeart, pendingLust);
          pendingHeart = 0;
          pendingLust = 0;
        }

        // Render inline branching choices
        if (line.choices && line.choices.length) {
          if (ui.hint) ui.hint.hidden = true;
          if (ui.choices) {
            ui.choices.innerHTML = "";
            line.choices.forEach(function (c) {
              var btn = document.createElement("button");
              btn.type = "button";
              btn.className = "choice";
              btn.textContent = c.text;
              btn.addEventListener("click", function (ev) {
                ev.stopPropagation();
                ui.choices.innerHTML = "";
                if (ui.hint) ui.hint.hidden = false;

                if (state) {
                  ensureStats(state);
                  if (c.trust) state.wanqing.trust = clamp(state.wanqing.trust + c.trust, 0, 100);
                  if (c.lust) state.wanqing.lust = clamp(state.wanqing.lust + c.lust, 0, 100);
                  if (c.stat && state.wanqing.stats[c.stat] != null) {
                    state.wanqing.stats[c.stat] += 1;
                  }
                  ["mouth", "hand", "foot", "vaginal", "anal", "climax"].forEach(function(k) {
                    if (c[k]) state.wanqing.stats[k] = (state.wanqing.stats[k] || 0) + c[k];
                  });
                  persist();
                  popHeart(c.trust, c.lust);
                  renderNpcPanel();
                }

                var reaction = (c.postLines || []).slice();
                if (c.say) {
                  reaction.unshift({ speaker: "wanqing", char: c.char || line.char || "e1", text: c.say });
                }
                lineQueue = reaction.concat(lineQueue);
                advanceLines();
              });
              ui.choices.appendChild(btn);
            });
          }
        } else if (ui.hint) {
          ui.hint.hidden = false;
        }
      }
    }, 28);
  }

  function finishLines() {
    clearType();
    lineQueue = [];
    var fn = afterLines;
    afterLines = null;
    if (fn) fn();
    else enterMap();
  }

  function playLines(lines, then, heart, lust) {
    lineQueue = (lines || []).slice();
    afterLines = then || null;
    pendingHeart = heart > 0 ? heart : 0;
    pendingLust = lust > 0 ? lust : 0;
    if (!lineQueue.length) {
      finishLines();
      return;
    }
    hideSheet();
    setTalking(true);
    showLine(lineQueue.shift());
  }

  function advanceLines() {
    if (mode !== "talk") return;
    if (typeTimer) {
      clearType();
      if (ui.text) ui.text.textContent = typeFull;
      if (pendingHeart || pendingLust) {
        popHeart(pendingHeart, pendingLust);
        pendingHeart = 0;
        pendingLust = 0;
      }
      return;
    }
    // CRITICAL: If choices are actively displayed in ui.choices, DO NOT close lines! Wait for user click!
    if (ui.choices && ui.choices.children && ui.choices.children.length > 0) {
      return;
    }
    if (lineQueue.length) {
      showLine(lineQueue.shift());
      return;
    }
    finishLines();
  }

  function statusLine() {
    return LOC_CN[state.playerLocation] || "";
  }

  function CheckMandatoryEvents(s) {
    if (!s) return null;
    evaluateStage(s);
    var t = s.wanqing ? (s.wanqing.trust || 0) : 0;
    var l = s.wanqing ? (s.wanqing.lust || 0) : 0;
    var d = s.dayCount || 1;
    
    if (t >= 30 && !flag(s, "Event_Trust30_Auto")) {
      setFlag(s, "Event_Trust30_Auto", true);
      return [
        { speaker: "wanqing", char: "s2", text: "“那个……我们合租也有段日子了。以前我都把你当外人看待，现在觉得，有你在身边其实也挺好的。”" },
        { speaker: "player", text: "“谢谢晚晴姐，我也会继续努力做个好室友的。”" },
        { speaker: "wanqing", char: "e1", text: "“嗯……叫我晚晴就好了。对了，既然熟了，以后你想聊些深一点的【成人话题】……我也不是不能陪你聊聊。”" },
        { speaker: "narration", text: "（🎉【S3·傍晚客厅试探】已解锁！林晚晴对你的态度温和了许多，傍晚去客厅与她靠近吧！）" }
      ];
    }

    if (t >= 40 && l >= 20 && d >= 2 && !flag(s, "Event_StageS4_Auto")) {
      setFlag(s, "Event_StageS4_Auto", true);
      return [
        { speaker: "wanqing", char: "e2", text: "“小陈……你每次在我做饭洗碗的时候看着我，我都觉得身上热烫烫的……”" },
        { speaker: "player", text: "“因为晚晴系着围裙洗碗的样子，真的很吸引人。”" },
        { speaker: "narration", text: "（🎉【S4·厨房忙碌与洗碗深吹】已解锁！去厨房尝试在她洗碗时贴近她吧！）" }
      ];
    }
    
    if (t >= 60 && !flag(s, "Event_Trust60_Auto")) {
      setFlag(s, "Event_Trust60_Auto", true);
      return [
        { speaker: "wanqing", char: "e2", text: "“感觉每次和你说话，我的心跳都比平时要快……我是怎么了。你，是不是对我有什么想法？”" },
        { speaker: "player", text: "“晚晴，既然你都这么问了……我确实控制不住被你吸引。”" },
        { speaker: "wanqing", char: "e5", text: "“你、你这孩子太直白了……不过，我不讨厌。以后……有什么亲密的举动，你可以【直入正题】了……”" },
        { speaker: "narration", text: "（🎉【S5·周末午睡偷香/沙发极乐】已解锁！林晚晴对你产生深深依赖，午后可去她卧室探寻！）" }
      ];
    }

    if (t >= 70 && l >= 50 && d >= 3 && !flag(s, "Event_StageS6_Auto")) {
      setFlag(s, "Event_StageS6_Auto", true);
      return [
        { speaker: "wanqing", char: "e4", text: "“小陈……最近在洗衣房洗衣服的时候，我总是忍不住想起你从后面抱我的样子……”" },
        { speaker: "narration", text: "（🎉【S6·狭小洗衣房后入】已解锁！去洗衣房顺手关上拉门吧！）" }
      ];
    }

    if (t >= 80 && l >= 60 && d >= 3 && !flag(s, "Event_StageS7_Auto")) {
      setFlag(s, "Event_StageS7_Auto", true);
      return [
        { speaker: "wanqing", char: "e5", text: "“以后我洗澡要是忘了拿毛巾……你可以直接推门送进来，我不介意……”" },
        { speaker: "narration", text: "（🎉【S7·水汽浴室全裸地砖】已解锁！浴室送毛巾开启全裸地砖激情！）" }
      ];
    }

    if (t >= 85 && l >= 70 && d >= 4 && !flag(s, "Event_StageS8_Auto")) {
      setFlag(s, "Event_StageS8_Auto", true);
      return [
        { speaker: "wanqing", char: "l5", text: "“天台的风吹着真舒服……无论是白天晒衣服还是夜里看星空，我都想让你陪着我。”" },
        { speaker: "narration", text: "（🎉【S8·晴空与星空天台狂欢】已解锁！去天台体验多元姿势链！）" }
      ];
    }
    
    if (t >= 91 && l >= 50 && !flag(s, "Event_沦陷_Auto")) {
      setFlag(s, "Event_沦陷_Auto", true);
      return [
        { speaker: "wanqing", char: "e4", text: "“我已经……完全没有办法离开你了。无论是白天还是黑夜，脑子里全是你……”" },
        { speaker: "player", text: "“晚晴，那我们就永远不要分开，一直合租下去。”" },
        { speaker: "wanqing", char: "e5", text: "“嗯……今晚，我的房门不锁。你要是敢不来，我可要生气的哦。”" },
        { speaker: "narration", text: "（🎉【S9·深夜门虚掩·彻底沦陷】终极阶段已解锁！林晚晴已对你彻底沦陷！）" }
      ];
    }
    
    return null;
  }

  function enterMap() {
    if (flag(state, "BadEnd_Rent")) {
      playLines([{ speaker: "narration", text: "（这间次卧到此为止。）" }], function () {});
      persist();
      return;
    }
    var bad = (tables.rules && tables.rules.suspicionBad) || 95;
    if (state.wanqing.suspicion >= bad) {
      playLines(
        [{ speaker: "wanqing", char: "a2", text: "你搬出去。这屋子我自己住。" }],
        function () {
          setFlag(state, "BadEnd_Rent", true);
          persist();
        }
      );
      return;
    }

    var autoPlot = CheckMandatoryEvents(state);
    if (autoPlot) {
      playLines(autoPlot, enterMap);
      return;
    }

    mode = "map";
    if (!npcHere(state)) {
      isNpcPanelRevealed = false;
    }
    currentCategory = "";
    setTalking(false);
    paintStage();
    paintHud();
    renderNpcPanel();
    renderHotspots();
    renderMiniMap();
    if (ui.name) ui.name.textContent = "";
    clearType();
    if (ui.text) ui.text.textContent = statusLine();
    persist();
  }

  function hideSheet() {
    if (ui.sheet) ui.sheet.classList.add("hidden");
  }

  function openSheet(title, choices) {
    if (!ui.sheet) return;
    if (ui.sheetTitle) ui.sheetTitle.textContent = title || "选择交互";
    if (ui.sheetBody) {
      ui.sheetBody.innerHTML = "";
      if (Array.isArray(choices)) {
        choices.forEach(function (c) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "slg-sheet-option" + (c.locked ? " is-locked" : "");
          btn.innerHTML = "<span class='opt-text'>" + c.text + "</span>" +
            (c.sub ? "<span class='opt-sub'>" + c.sub + "</span>" : "");
          btn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            hideSheet();
            if (c.action) c.action();
          });
          ui.sheetBody.appendChild(btn);
        });
      }
    }
    ui.sheet.classList.remove("hidden");
  }

  var InteractionManager = {
    triggerInteraction: function (type) {
      if (mode !== "map") return;

      if (type === "bathing" || (type === "Bathroom" && state.wanqing.currentState === "Bathing")) {
        InteractionManager.handleBathingInteraction();
        return;
      }

      if (type === "sleeping" || (type === "Bedroom_NPC" && state.wanqing.currentState === "Sleeping")) {
        InteractionManager.handleSleepingInteraction();
        return;
      }

      if (type === "sleep" || type === "bed" || type === "Bedroom_Player_Bed") {
        InteractionManager.handleSleepInteraction();
        return;
      }

      if (type === "char" || type === "npc") {
        InteractionManager.handleCharClick();
        return;
      }

      doAct(type);
    },

    handleCharClick: function () {
      if (mode !== "map") return;

      if (state.wanqing.currentState === "Bathing" && state.playerLocation === "Bathroom") {
        InteractionManager.handleBathingInteraction();
        return;
      }

      if (state.wanqing.currentState === "Sleeping" && state.playerLocation === "Bedroom_NPC") {
        InteractionManager.handleSleepingInteraction();
        return;
      }

      isNpcPanelRevealed = !isNpcPanelRevealed;
      currentCategory = "";
      renderNpcPanel();

      if (npcHere(state) && ui.text) {
        var b = bandOf(state.wanqing.trust);
        var greet = b.id === "tenant" ? "“有什么事情吗？”" :
                    b.id === "roommate" ? "“呀，你回房间啦。找我有事聊聊天吗？”" :
                    b.id === "depend" ? "“你回来啦，今天也挺辛苦的吧。想跟我聊些什么呢？”" : 
                    "“只要看着你的眼睛，我就已经心乱如麻了……”";
        ui.text.textContent = greet;
        if (ui.name) ui.name.textContent = "晚晴";
        if (window.Stage) Stage.setChar(portraitFor(state));
      }
    },

    handleBathingInteraction: function () {
      if (isDailyDone(state, "bathing")) {
        playLines([
          { speaker: "wanqing", char: "e1", text: "“小陈，今天已经在浴室陪我聊过天了，我马上就洗好了，你去别处转转吧。”" },
          { speaker: "narration", text: "（今天已经在浴室与晚晴互动过了，频繁打扰她会让彼此感到尴尬的，去做点别的互动吧！）" }
        ], enterMap);
        return;
      }

      var trust = state.wanqing.trust || 0;
      var lust = state.wanqing.lust || 0;
      var suspicion = state.wanqing.suspicion || 0;

      var choices = [
        {
          text: "🚪 隔门礼貌打个招呼",
          sub: "体力 -5，信赖 +2",
          action: function() {
            markDailyDone(state, "bathing");
            state.playerEnergy = clamp(state.playerEnergy - 5, 0, 100);
            state.wanqing.trust = clamp(state.wanqing.trust + 2, 0, 100);
            playLines([
              { speaker: "player", text: "“晚晴，是我。你慢慢洗，我不急着拿东西。”" },
              { speaker: "wanqing", char: "e1", text: "“啊……好的！小陈，水温刚好，我马上就洗完了哦。”" },
              { speaker: "narration", text: "（你在门外体贴地提醒了一声，她轻声回应，语气里满是安心。）" }
            ], enterMap);
          }
        }
      ];

      if (trust >= 15 || lust >= 10) {
        choices.push({
          text: "🫣 贴着门缝偷看透光水雾",
          sub: "消耗 15 体力，警惕 +10，欲望 +5",
          action: function() {
            if (state.playerEnergy < 15) {
              playLines([{ speaker: "narration", text: "（体力不足，还是先休息一会儿吧。）" }], enterMap);
              return;
            }
            markDailyDone(state, "bathing");
            state.playerEnergy = clamp(state.playerEnergy - 15, 0, 100);
            
            if (suspicion >= 80) {
              state.wanqing.suspicion = clamp(state.wanqing.suspicion + 10, 0, 100);
              playLines([
                { speaker: "narration", text: "（她防备心极重，浴室门缝被她用毛巾塞得严严实实，踩水声惊动了她…… 警惕值增加！）" }
              ], enterMap);
              return;
            }
            
            state.wanqing.suspicion = clamp(state.wanqing.suspicion + 10, 0, 100);
            state.wanqing.lust = clamp((state.wanqing.lust || 0) + 5, 0, 100);
            TimeTransitionController.play("🫣 门缝偷窥", "水汽氤氲，娇躯隐现", function() {
              playVideoEvent("S7_bathroom_full", enterMap);
            });
          }
        });
      } else {
        choices.push({
          text: "🔒 贴着门缝偷看透光水雾",
          sub: "需与晚晴信赖 ≥ 15",
          locked: true,
          action: function() {
            playLines([
              { speaker: "narration", text: "（两人刚合租不久，彼此尚不熟悉，做这种越轨举动太唐突了……先提升与她的信赖度吧！）" }
            ], enterMap);
          }
        });
      }

      if (trust >= 40) {
        choices.push({
          text: "🛁 推门送毛巾进去",
          sub: "S7·水汽浴室全裸地砖姿势链",
          action: function() {
            markDailyDone(state, "bathing");
            TimeTransitionController.play("🛁 浴室送毛巾", "推开浴室门，水汽湿热", function() {
              playVideoEvent("S7_bathroom_full", enterMap);
            });
          }
        });
      } else {
        choices.push({
          text: "🔒 推门送毛巾进去",
          sub: "需与晚晴信赖 ≥ 40",
          locked: true,
          action: function() {
            playLines([
              { speaker: "wanqing", char: "sur1", text: "“呀！你……你干嘛不敲门直接推门进来呀！快出去！”" },
              { speaker: "narration", text: "（信赖值不足 40，她害羞地把你赶了出来，需要先提升与她的信赖度！）" }
            ], enterMap);
          }
        });
      }

      if (trust >= 75 && lust >= 50) {
        choices.push({
          text: "🚿 直接步入水汽蒸腾的浴室相拥",
          sub: "要求信赖 ≥ 75 且 欲望 ≥ 50",
          action: function() {
            markDailyDone(state, "bathing");
            TimeTransitionController.play("🚿 步入相拥", "水流倾泻，相拥温存", function() {
              playVideoEvent("S7_bathroom_full", enterMap);
            });
          }
        });
      } else {
        choices.push({
          text: "🔒 直接步入浴室相拥",
          sub: "需信赖 ≥ 75 & 欲望 ≥ 50",
          locked: true,
          action: function() {
            playLines([
              { speaker: "wanqing", char: "e2", text: "“你……你怎么进来了……太害羞了，快把眼睛闭上……”" },
              { speaker: "narration", text: "（信赖或欲望不足，尚不敢如此放肆直接跨入浴室。）" }
            ], enterMap);
          }
        });
      }

      openSheet("🛁 浴室·水汽隐现互动", choices);
    },

    handleSleepingInteraction: function () {
      if (isDailyDone(state, "sleeping_room")) {
        playLines([
          { speaker: "narration", text: "（晚晴在被窝里甜甜睡着，今天已经进来看望过她了，别频频惊扰她的好梦，去别处转转吧。）" }
        ], enterMap);
        return;
      }

      var trust = state.wanqing.trust || 0;

      var choices = [
        {
          text: "🚪 轻轻敲敲门唤她一声",
          sub: "体力 -5，信赖 +1",
          action: function() {
            markDailyDone(state, "sleeping_room");
            state.playerEnergy = clamp(state.playerEnergy - 5, 0, 100);
            state.wanqing.trust = clamp(state.wanqing.trust + 1, 0, 100);
            playLines([
              { speaker: "player", text: "“晚晴，盖好被子，别着凉了。”" },
              { speaker: "wanqing", char: "e1", text: "“唔……小陈吗？嗯……知道了，晚安哦……”" },
              { speaker: "narration", text: "（她在梦呓中含糊地答应了一声，把被角往上拉了拉。）" }
            ], enterMap);
          }
        }
      ];

      if (trust >= 50) {
        choices.push({
          text: "🔑 用备用钥匙悄悄溜进床边",
          sub: "S5_nap·午睡偷香 / S9·彻底沦陷",
          action: function() {
            markDailyDone(state, "sleeping_room");
            TimeTransitionController.play("🔑 溜进闺房", "钥匙微响，溜至床边", function() {
              var vid = state.wanqing.trust >= 90 ? "S9_bedroom_obsession" : "S5_nap_bedroom";
              playVideoEvent(vid, enterMap);
            });
          }
        });
      } else {
        choices.push({
          text: "🔒 用备用钥匙悄悄溜进床边",
          sub: "需与晚晴信赖 ≥ 50",
          locked: true,
          action: function() {
            playLines([
              { speaker: "narration", text: "（房门被她从里面插上了小栓，信赖值不足 50，无法轻易溜进去。）" }
            ], enterMap);
          }
        });
      }

      openSheet("🌙 闺房·晚晴甜美熟睡", choices);
    },

    handleSleepInteraction: function () {
      var trust = state.wanqing.trust || 0;
      var lust = state.wanqing.lust || 0;
      var isDaydreamUnlocked = trust >= 30 || lust >= 15;
      var isSneakUnlocked = trust >= 50 && lust >= 20;

      var choices = [
        {
          text: "🛌 床上小憩午睡",
          sub: "恢复 30 体力，跳过当前时段",
          action: function() {
            if (isDailyDone(state, "bed_nap")) {
              playLines([
                { speaker: "narration", text: "（今天已经午睡小憩过了，精神饱满，今天去尝试做点别的互动吧！）" }
              ], enterMap);
              return;
            }
            markDailyDone(state, "bed_nap");
            TimeTransitionController.play("🛌 床上小憩", "午后微风，短憩惬意", function() {
              state.playerEnergy = clamp(state.playerEnergy + 30, 0, 100);
              state._spentSlot = true;
              var how = advanceSlotIfNeeded();
              applySchedule(state);
              var nextSlotCn = SLOT_CN[state.currentTimeSlot];
              playLines([
                { speaker: "narration", text: "（你在床上舒舒服服地睡了个午觉。体力恢复了！）" },
                { speaker: "narration", text: "（一眨眼，时间来到了 " + nextSlotCn + "。）" }
              ], enterMap);
            });
          }
        },
        {
          text: "💤 沉沉深睡到天亮",
          sub: "精力恢复 100%，天数 +1，进入清晨",
          action: function() {
            TimeTransitionController.play("🌙 沉沉深睡", "夜深人静，朝阳再起", function() {
              nightProcess(state);
              applySchedule(state);
              playLines([
                { speaker: "narration", text: "（一觉醒来。阳光洒在枕畔。新的一天，第 " + state.dayCount + " 天！）" }
              ], enterMap);
            });
          }
        }
      ];

      if (isDaydreamUnlocked) {
        choices.push({
          text: "💭 躺在床头静静遐想温存",
          sub: "恢复 10 体力，欲望 +2",
          action: function() {
            if (isDailyDone(state, "bed_daydream")) {
              playLines([
                { speaker: "narration", text: "（今天已经躺在床头静静遐想思念过晚晴了，暗香与温存萦绕在心头，明天再来静静遐想吧。）" }
              ], enterMap);
              return;
            }
            markDailyDone(state, "bed_daydream");
            TimeTransitionController.play("💭 床头遐想", "温存思念，暗香浮动", function() {
              state.playerEnergy = clamp(state.playerEnergy + 10, 0, 100);
              state.wanqing.lust = clamp((state.wanqing.lust || 0) + 2, 0, 100);
              playLines([
                { speaker: "narration", text: "（你枕着手臂望着天花板，脑海里全是对走廊那头晚晴温存软语的思念遐想……欲望微动。）" }
              ], enterMap);
            });
          }
        });
      } else {
        choices.push({
          text: "🔒 床头遐想 (需与晚晴信赖 ≥ 30)",
          sub: "好感不足，未曾建立亲密关系",
          locked: true,
          action: function() {
            playLines([
              { speaker: "narration", text: "（和房东太太刚合租认识不久，彼此尚客套礼貌，未曾有更深的了解……脑海里还不敢有越轨遐想。先多与她交流提升信赖吧！）" }
            ], enterMap);
          }
        });
      }

      if (isSneakUnlocked) {
        choices.push({
          text: "🔑 悄悄溜去隔壁晚晴卧室",
          sub: "S5_nap·午睡偷香 / S9·彻底沦陷",
          action: function() {
            TimeTransitionController.play("🔑 夜色偷溜", "蹑手蹑脚，扣响房门", function() {
              var vid = state.wanqing.trust >= 90 ? "S9_bedroom_obsession" : "S5_nap_bedroom";
              playVideoEvent(vid, enterMap);
            });
          }
        });
      } else {
        choices.push({
          text: "🔒 悄悄溜去隔壁晚晴卧室",
          sub: "需与晚晴信赖 ≥ 50 & 欲望 ≥ 20",
          locked: true,
          action: function() {
            playLines([
              { speaker: "narration", text: "（房门被她从里面插上了小栓，信赖与欲望尚不足，深夜私闯失礼冒犯，无法溜进去。）" }
            ], enterMap);
          }
        });
      }

      openSheet("🛏️ 次卧·床上度过方式", choices);
    }
  };

  function goPlace(id) {
    if (mode !== "map") return;
    var from = state.playerLocation;

    if (id === "Bathroom" && state.wanqing.currentState === "Bathing" && state.wanqing.currentLocation === "Bathroom") {
      state.playerLocation = id;
      InteractionManager.handleBathingInteraction();
      return;
    }

    if (id === "Bedroom_NPC" && state.wanqing.currentState === "Sleeping") {
      state.playerLocation = id;
      InteractionManager.handleSleepingInteraction();
      return;
    }

    state.playerLocation = id;
    isNpcPanelRevealed = false;
    currentCategory = "";
    maybeWander(state, id);
    var bump = onEnterLines(state, from);
    if (bump) {
      playLines(bump, enterMap);
      return;
    }
    enterMap();
  }

  function advanceSlotIfNeeded() {
    if (!state._spentSlot) return;
    state._spentSlot = false;
    var i = SLOTS.indexOf(state.currentTimeSlot);
    if (i < 0 || i >= SLOTS.length - 1) {
      nightProcess(state);
      return "day";
    }
    enterSlot(state, SLOTS[i + 1], false);
    return "slot";
  }

  function processTimeSlot() {
    if (!state) return "off";
    state._spentSlot = true;
    var res = advanceSlotIfNeeded();
    paintHud();
    return res;
  }

  function doAct(id) {
    if (mode !== "map") return;
    if (id === "sleep") {
      InteractionManager.handleSleepInteraction();
      return;
    }

    if (id !== "phone" && id !== "gift" && isDailyDone(state, id)) {
      playLines([
        { speaker: "narration", text: "（今天已经在此时此地做过这项互动了，收获满满。今天去尝试做点别的互动吧！）" }
      ], enterMap);
      return;
    }

    var t0 = state.wanqing.trust;
    var lines = execAction(state, id);
    if (id === "phone" || id === "gift") return;

    markDailyDone(state, id);

    if (state._spentSlot) {
      triggerTimeTransition("时光更迭...", "时光划过，阶段转推...", function() {
        var how = advanceSlotIfNeeded();
        if (how === "day") {
          lines.push({ speaker: "narration", text: "（一眨眼就到第二天早上了。）" });
          var man = mandatoryLines(state);
          if (man) lines = lines.concat(man);
        }
        playLines(lines, enterMap, state.wanqing.trust - t0);
      });
    } else {
      playLines(lines, enterMap, state.wanqing.trust - t0);
    }
  }

  function bind(nodes) {
    ui = nodes || {};
    if (ui.panel) {
      ui.panel.addEventListener("click", function (ev) {
        if (ev.target && ev.target.classList && ev.target.classList.contains("choice")) return;
        if (mode === "talk") advanceLines();
      });
    }
    
    if (ui.npcPanel) {
      ui.npcPanel.addEventListener("click", function (ev) {
        if (mode !== "map") return;
        ev.stopPropagation();
        InteractionManager.handleCharClick();
      });
    }

    // Character sprite click interaction
    var charLayer = document.getElementById("layer-char");
    if (charLayer) {
      charLayer.addEventListener("click", function (ev) {
        if (ev.target && ev.target.classList && ev.target.classList.contains("stage-char-img")) {
          if (mode !== "map") return;
          ev.stopPropagation();
          InteractionManager.handleCharClick();
        }
      });
    }

    if (ui.mapFab && ui.mapBox) {
      ui.mapFab.addEventListener("click", function () {
        if (mode !== "map") return;
        ui.mapBox.classList.toggle("hidden");
        renderMiniMap();
      });
    }
    if (ui.mapClose && ui.mapBox) {
      ui.mapClose.addEventListener("click", function () {
        ui.mapBox.classList.add("hidden");
      });
    }

    var btnMenuGallery = document.getElementById("menu-gallery");
    if (btnMenuGallery) {
      btnMenuGallery.addEventListener("click", function () {
        var ms = document.getElementById("menu-sheet");
        if (ms) ms.classList.add("hidden");
        openGallery("all");
      });
    }
  }

  function findVideoDef(vid) {
    var vList = tables.videos || [];
    for (var i = 0; i < vList.length; i++) {
      if (vList[i].id === vid || vList[i].stage === vid) return vList[i];
    }
    return vList[0] || null;
  }

  var StoryStateManager = {
    getCurrentStage: function () {
      if (!state) return "S0";
      return evaluateStage(state);
    },
    getUnlockedStages: function () {
      if (!state) return ["S0"];
      evaluateStage(state);
      return state.unlockedStages || ["S0"];
    },
    isStageUnlocked: function (stageId) {
      var unlocked = StoryStateManager.getUnlockedStages();
      return unlocked.indexOf(stageId) >= 0;
    }
  };

  function playStage(stageId, onDone) {
    stageId = stageId || StoryStateManager.getCurrentStage();
    var v = findVideoDef(stageId);
    if (!v) {
      // Search by stage field in videos table
      var vList = tables.videos || [];
      for (var i = 0; i < vList.length; i++) {
        if (vList[i].stage === stageId) {
          v = vList[i];
          break;
        }
      }
    }

    if (!v) {
      playVideoEvent(stageId, onDone);
      return;
    }

    playVideoEvent(v.id, onDone);
  }

  function markVideoUnlocked(vid) {
    if (!state) return;
    if (!state.unlockedVideos) state.unlockedVideos = [];
    if (state.unlockedVideos.indexOf(vid) < 0) {
      state.unlockedVideos.push(vid);
      persist();
    }
  }

  function playVideoEvent(vid, onDone) {
    var v = findVideoDef(vid);
    if (!v) {
      if (onDone) onDone();
      else enterMap();
      return;
    }

    markVideoUnlocked(v.id);
    mode = "video";
    hideSheet();

    var layerVideo = document.getElementById("layer-video");
    var videoEl = document.getElementById("video-element");
    var videoFallback = document.getElementById("video-fallback");
    var videoFallbackChar = document.getElementById("video-fallback-char");
    var videoTitle = document.getElementById("video-title");
    var videoCaption = document.getElementById("video-caption");
    var videoTierBadge = document.getElementById("video-tier-badge");
    var videoSubActs = document.getElementById("video-sub-acts");
    var btnVideoFinish = document.getElementById("btn-video-finish");
    var btnVideoClose = document.getElementById("btn-video-close");
    var videoFade = document.getElementById("video-fade");

    if (layerVideo) layerVideo.classList.remove("hidden");
    if (videoFade) videoFade.classList.remove("is-active");

    var tierLabels = { A: "A档·着衣摸", B: "B档·口", C: "C档·插入", D: "D档·床特写" };
    if (videoTierBadge) videoTierBadge.textContent = tierLabels[v.tier] || (v.tier + "档");
    if (videoTitle) videoTitle.textContent = v.title || "情境互动";
    if (videoCaption) videoCaption.textContent = v.prompt || v.lead || "";

    var loopSrc = (window.VideoPack && window.VideoPack.resolve(v.loopSrc || v.loop)) || (v.loopSrc || v.loop);
    var finishSrc = (window.VideoPack && window.VideoPack.resolve(v.finishSrc || v.finish)) || (v.finishSrc || v.finish);

    if (videoSubActs) {
      videoSubActs.innerHTML = "";
      if (v.subOptions && v.subOptions.length) {
        v.subOptions.forEach(function (sub) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "video-sub-btn";
          btn.textContent = sub.label;
          btn.addEventListener("click", function () {
            if (videoCaption) videoCaption.textContent = sub.postText || "";
            if (state) {
              if (sub.trustGain) state.wanqing.trust = clamp(state.wanqing.trust + sub.trustGain, 0, 100);
              if (sub.lustGain) state.wanqing.lust = clamp(state.wanqing.lust + sub.lustGain, 0, 100);
            }
            var subSrc = (window.VideoPack && window.VideoPack.resolve(sub.loopSrc || sub.loop)) || (sub.loopSrc || sub.loop);
            if (subSrc && videoEl) {
              videoEl.src = subSrc;
              videoEl.play().catch(function () {});
            }
          });
          videoSubActs.appendChild(btn);
        });
      }
    }

    var isVideoLoaded = false;
    if (videoFallback) videoFallback.classList.add("is-hidden");

    function triggerFallback() {
      if (videoFallback) {
        videoFallback.classList.remove("is-hidden");
        if (videoFallbackChar) {
          var charSrc = "assets/char/wanqing/" + (v.char || "e1") + ".png";
          videoFallbackChar.src = charSrc;
        }
      }
    }

    if (videoEl && loopSrc) {
      videoEl.oncanplay = function () {
        isVideoLoaded = true;
        if (videoFallback) videoFallback.classList.add("is-hidden");
      };
      videoEl.onerror = function () {
        triggerFallback();
      };
      videoEl.src = loopSrc;
      videoEl.loop = true;
      var playPromise = videoEl.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          triggerFallback();
        });
      }
    } else {
      triggerFallback();
    }

    function cleanupAndEnd() {
      if (videoFade) videoFade.classList.add("is-active");
      window.setTimeout(function () {
        if (videoEl) {
          videoEl.pause();
          videoEl.removeAttribute("src");
        }
        if (layerVideo) layerVideo.classList.add("hidden");
        if (videoFade) videoFade.classList.remove("is-active");

        if (state) {
          state.wanqing.trust = clamp(state.wanqing.trust + (v.tier === "A" ? 4 : v.tier === "B" ? 8 : 12), 0, 100);
          state.wanqing.lust = clamp(state.wanqing.lust + (v.tier === "A" ? 6 : v.tier === "B" ? 12 : 18), 0, 100);

          IntimacyStatsManager.recordAction(v);
        }

        var lines = v.postLines || [
          { speaker: "wanqing", char: v.char || "e1", text: "……好了，别闹了，该歇着了。" }
        ];
        playLines(lines, onDone || enterMap, v.tier === "A" ? 4 : 8);
      }, 400);
    }

    if (btnVideoFinish) {
      btnVideoFinish.onclick = function () {
        btnVideoFinish.disabled = true;
        if (isVideoLoaded && videoEl && finishSrc) {
          videoEl.loop = false;
          videoEl.src = finishSrc;
          videoEl.onended = function () {
            cleanupAndEnd();
          };
          videoEl.play().catch(function () {
            cleanupAndEnd();
          });
        } else {
          cleanupAndEnd();
        }
      };
      btnVideoFinish.disabled = false;
    }

    if (btnVideoClose) {
      btnVideoClose.onclick = function () {
        if (videoEl) {
          videoEl.pause();
          videoEl.removeAttribute("src");
        }
        if (layerVideo) layerVideo.classList.add("hidden");
        if (onDone) onDone();
        else enterMap();
      };
    }
  }

  function openGallery(tierFilter) {
    tierFilter = tierFilter || "all";
    var gallerySheet = document.getElementById("gallery-sheet");
    var galleryGrid = document.getElementById("gallery-grid");
    var galleryClose = document.getElementById("gallery-close");
    if (!gallerySheet || !galleryGrid) return;

    gallerySheet.classList.remove("hidden");

    var tabs = gallerySheet.querySelectorAll(".gallery-tab");
    tabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.getAttribute("data-tier") === tierFilter);
      tab.onclick = function () {
        openGallery(tab.getAttribute("data-tier"));
      };
    });

    if (galleryClose) {
      galleryClose.onclick = function () {
        gallerySheet.classList.add("hidden");
      };
    }

    var list = tables.videos || [];
    if (tierFilter === "variant") {
      list = list.filter(function (v) { return !!v.isGalleryVariant; });
    } else if (tierFilter !== "all") {
      list = list.filter(function (v) { return v.tier === tierFilter && !v.isGalleryVariant; });
    }

    galleryGrid.innerHTML = "";
    var unlocked = (state && state.unlockedVideos) || [];

    list.forEach(function (v) {
      var item = document.createElement("div");
      // If opened from title screen or test mode, let user replay to test and inspect media
      var isUnlocked = !state || unlocked.indexOf(v.id) >= 0 || v.tier === "A" || v.isGalleryVariant;
      item.className = "gallery-item" + (isUnlocked ? " is-unlocked" : "");

      var badge = document.createElement("span");
      badge.className = "gallery-item-badge";
      badge.textContent = (v.isGalleryVariant ? "变体 · " : (v.tier + "档 · ")) + (LOC_CN[v.loc] || v.loc);

      var title = document.createElement("div");
      title.className = "gallery-item-title";
      title.textContent = v.title;

      var desc = document.createElement("div");
      desc.className = "gallery-item-desc";
      desc.textContent = isUnlocked ? (v.desc || v.lead) : ("达成条件：信赖 ≥ " + v.trustMin + (v.lustMin ? "，欲望 ≥ " + v.lustMin : "") + "，" + (LOC_CN[v.loc] || "特定时段"));

      item.appendChild(badge);
      item.appendChild(title);
      item.appendChild(desc);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-item-btn";
      btn.textContent = isUnlocked ? "▶ 播放鉴赏" : "未解锁";
      btn.disabled = !isUnlocked;
      btn.onclick = function () {
        gallerySheet.classList.add("hidden");
        playVideoEvent(v.id, function () {
          if (!state) {
            var screenTitle = document.getElementById("screen-title");
            var screenGame = document.getElementById("screen-game");
            if (screenTitle) screenTitle.classList.remove("hidden");
            if (screenGame) screenGame.classList.add("hidden");
          } else {
            enterMap();
          }
        });
      };
      item.appendChild(btn);

      galleryGrid.appendChild(item);
    });
  }

  function onCharClick() {
    if (mode !== "map") return;
    if (!npcHere(state)) return;

    isNpcPanelRevealed = true;
    currentCategory = "";
    renderNpcPanel();

    if (ui.text) {
      var b = bandOf(state.wanqing.trust);
      var greet = b.id === "tenant" ? "“小陈，你找我？房东的工作有些琐碎，有什么事需要帮忙吗？”" :
                  b.id === "roommate" ? "“呀，你过来啦？是有什么想聊的，还是想找我搭把手做家务呢？”" :
                  b.id === "depend" ? "“你……你离得这么近看着我干嘛。不知道怎么回事，一看到你心跳就变快了……”" : 
                  "“傻瓜，你终于舍得理我啦？无论白天还是黑夜，我的眼里全都是你呢……”";
      ui.text.textContent = greet;
      if (ui.name) ui.name.textContent = "晚晴";
      if (window.Stage) Stage.setChar(portraitFor(state));
    }
  }

  var TimeTransitionController = {
    isTransitioning: false,
    play: function (title, subText, callback) {
      if (TimeTransitionController.isTransitioning) return;
      TimeTransitionController.isTransitioning = true;

      var overlay = document.getElementById("time-transition-overlay");
      var titleEl = document.getElementById("time-transition-title");
      var subEl = document.getElementById("time-transition-sub");
      var iconEl = document.getElementById("time-transition-icon");

      if (!overlay) {
        TimeTransitionController.isTransitioning = false;
        if (callback) callback();
        return;
      }

      if (titleEl) titleEl.textContent = title || "时光流转...";
      if (subEl) subEl.textContent = subText || "光影轻摇，时光沉淀";
      if (iconEl) iconEl.textContent = nightish(state ? state.currentTimeSlot : "Evening") ? "🌙" : "☀";

      // Lock input & make transition container visible
      overlay.classList.remove("hidden");
      overlay.style.display = "flex";
      overlay.style.pointerEvents = "all";
      overlay.style.opacity = "0";

      // Force reflow for smooth opacity fade-in transition
      void overlay.offsetHeight;
      overlay.style.transition = "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
      overlay.style.opacity = "1";

      // Hold phase: Execute callback after fade in completes (500ms)
      window.setTimeout(function () {
        if (callback) {
          try {
            callback();
          } catch (e) {
            console.error(e);
          }
        }

        // Keep displayed during transition processing (600ms)
        window.setTimeout(function () {
          // Fade out phase
          overlay.style.opacity = "0";

          window.setTimeout(function () {
            overlay.classList.add("hidden");
            overlay.style.display = "";
            overlay.style.pointerEvents = "";
            TimeTransitionController.isTransitioning = false;
          }, 420);
        }, 600);
      }, 500);
    }
  };

  function triggerTimeTransition(title, subText, callback) {
    TimeTransitionController.play(title, subText, callback);
  }

  function openMinigameModal(onComplete) {
    var modal = document.getElementById("minigame-modal");
    var pointer = document.getElementById("minigame-pointer");
    var roundVal = document.getElementById("minigame-round-val");
    var scoreVal = document.getElementById("minigame-score-val");
    var hitBtn = document.getElementById("minigame-hit-btn");
    var closeBtn = document.getElementById("minigame-close-btn");

    if (!modal || !pointer || !hitBtn) {
      if (onComplete) onComplete(200);
      return;
    }

    modal.classList.remove("hidden");

    var round = 1;
    var maxRounds = 3;
    var totalScore = 0;
    var pos = 0;
    var speed = 2.5;
    var dir = 1;
    var animId = null;

    if (roundVal) roundVal.textContent = "1/3";
    if (scoreVal) scoreVal.textContent = "0";

    function updateAnim() {
      pos += speed * dir;
      if (pos >= 94) { pos = 94; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      pointer.style.left = pos + "%";
      animId = requestAnimationFrame(updateAnim);
    }

    animId = requestAnimationFrame(updateAnim);

    hitBtn.onclick = function () {
      cancelAnimationFrame(animId);

      var dist = Math.abs(pos - 52);
      var gained = 0;
      if (dist <= 12) {
        gained = 100;
        popHeart(3, 2);
      } else if (dist <= 25) {
        gained = 60;
        popHeart(1, 1);
      } else {
        gained = 30;
      }

      totalScore += gained;
      if (scoreVal) scoreVal.textContent = totalScore;

      round++;
      if (round <= maxRounds) {
        if (roundVal) roundVal.textContent = round + "/3";
        speed += 0.8;
        window.setTimeout(function () {
          animId = requestAnimationFrame(updateAnim);
        }, 350);
      } else {
        window.setTimeout(function () {
          modal.classList.add("hidden");
          cancelAnimationFrame(animId);

          if (state) {
            var trustBonus = totalScore >= 240 ? 12 : totalScore >= 160 ? 8 : 5;
            var lustBonus = totalScore >= 240 ? 10 : totalScore >= 160 ? 5 : 2;
            var goldBonus = totalScore >= 240 ? 300 : totalScore >= 160 ? 150 : 80;

            state.wanqing.trust = clamp(state.wanqing.trust + trustBonus, 0, 100);
            state.wanqing.lust = clamp((state.wanqing.lust || 0) + lustBonus, 0, 100);
            state.playerGold += goldBonus;
            paintHud();
            persist();

            triggerTimeTransition("🍳 心动美艳料理出锅！", "香气四溢，温情在屋里蔓延...", function () {
              var evalText = totalScore >= 240 ?
                "“哇……这特调和菜肴味道太赞了！小陈，你手艺也太好了吧！”（晚晴笑逐颜开，信赖 +" + trustBonus + "，欲望 +" + lustBonus + "，获得奖赏 ¥" + goldBonus + "）" :
                "“嗯~ 味道非常不错呢，辛苦你啦小陈！”（晚晴满意地点点头，信赖 +" + trustBonus + "）";
              
              playLines([
                { speaker: "wanqing", char: "s3", text: evalText }
              ], onComplete || enterMap);
            });
          }
        }, 300);
      }
    };

    if (closeBtn) {
      closeBtn.onclick = function () {
        cancelAnimationFrame(animId);
        modal.classList.add("hidden");
      };
    }
  }

  function openTaobaoModal() {
    var modal = document.getElementById("taobao-modal");
    var grid = document.getElementById("tb-product-grid");
    var goldVal = document.getElementById("tb-gold-val");
    var closeBtn = document.getElementById("tb-close-btn");
    if (!modal || !grid) return;

    modal.classList.remove("hidden");
    if (goldVal) goldVal.textContent = "¥ " + (state ? state.playerGold : 0);

    var currentCat = "all";
    var tabs = modal.querySelectorAll(".tb-tab");
    tabs.forEach(function (tab) {
      tab.onclick = function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        currentCat = tab.getAttribute("data-cat") || "all";
        renderGrid();
      };
    });

    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.classList.add("hidden");
      };
    }

    function renderGrid() {
      grid.innerHTML = "";
      var items = tables.items || {};
      var keys = Object.keys(items).filter(function (k) {
        var it = items[k];
        if (!it.shop) return false;
        if (currentCat === "all") return true;
        return (it.cat || "gift") === currentCat;
      });

      keys.forEach(function (k) {
        var p = items[k];
        var card = document.createElement("div");
        var hasIt = state && hasItem(state, p.id);
        card.className = "tb-prod-card";
        var pTag = p.cat === "tech" ? "数码安防" : p.cat === "lingerie" ? "魅惑情趣" : "精致礼品";
        var pIcon = p.cat === "tech" ? "📹" : p.cat === "lingerie" ? "👗" : "🎁";

        var html = "<div class='tb-prod-img-box'>" +
          "<span class='tb-prod-ico'>" + pIcon + "</span>" +
          "<span class='tb-prod-tag'>" + pTag + "</span>" +
          "</div>" +
          "<div class='tb-prod-info'>" +
          "<div class='tb-prod-title'>" + p.name + "</div>" +
          "<div class='tb-prod-desc'>" + p.text + "</div>" +
          "<div class='tb-prod-foot'>" +
          "<span class='tb-prod-price'>¥ <b>" + p.price + "</b></span>" +
          "<button type='button' class='tb-buy-btn'" + (hasIt ? " disabled" : "") + ">" + (hasIt ? "已拥有" : "立即购买") + "</button>" +
          "</div></div>";

        card.innerHTML = html;
        var btn = card.querySelector(".tb-buy-btn");
        if (btn && !hasIt) {
          btn.onclick = function () {
            if (!state || state.playerGold < p.price) {
              playLines([{ speaker: "narration", text: "（金币不足！可以去便利店兼职赚钱，或者去下厨料理赚钱。）" }], enterMap);
              modal.classList.add("hidden");
              return;
            }
            state.playerGold -= p.price;
            addItem(state, p.id);
            if (p.id === "camera") state.cameraInstalled = true;
            persist();
            paintHud();
            if (goldVal) goldVal.textContent = "¥ " + state.playerGold;
            btn.textContent = "购买成功！";
            btn.disabled = true;
            popHeart(3, 0);
            window.setTimeout(function () {
              renderGrid();
            }, 500);
          };
        }
        grid.appendChild(card);
      });
    }

    renderGrid();
  }

  function openCctvModal() {
    var modal = document.getElementById("cctv-modal");
    var feedLayer = document.getElementById("cctv-feed-layer");
    var clockEl = document.getElementById("cctv-clock");
    var closeBtn = document.getElementById("cctv-close-btn");
    var camTag = document.getElementById("cctv-cam-tag");
    var nvBtn = document.getElementById("btn-cctv-nv");
    var snapBtn = document.getElementById("btn-cctv-snap");

    if (!modal || !feedLayer) return;
    modal.classList.remove("hidden");

    var currentCam = "cam01";
    var isNightVision = false;

    function updateClock() {
      if (!clockEl) return;
      var now = new Date();
      var pad = function (n) { return n < 10 ? "0" + n : n; };
      clockEl.textContent = "LIVE ● " + now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " REC";
    }
    updateClock();

    var btns = modal.querySelectorAll(".cctv-ch-btn");
    btns.forEach(function (btn) {
      btn.onclick = function () {
        btns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        currentCam = btn.getAttribute("data-cam") || "cam01";
        renderFeed();
      };
    });

    if (nvBtn) {
      nvBtn.onclick = function () {
        isNightVision = !isNightVision;
        nvBtn.textContent = isNightVision ? "🟢 夜视仪 ON" : "🟢 夜视仪 OFF";
        feedLayer.classList.toggle("is-nv", isNightVision);
      };
    }

    if (snapBtn) {
      snapBtn.onclick = function () {
        feedLayer.style.opacity = "0.2";
        window.setTimeout(function () {
          feedLayer.style.opacity = "1";
          alert("📸 监控画面已生成超高清快照存入相册！");
        }, 150);
      };
    }

    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.classList.add("hidden");
      };
    }

    function renderFeed() {
      feedLayer.innerHTML = "";
      if (currentCam === "cam01") {
        if (camTag) camTag.textContent = "CAM-01 浴室 Bathroom";
        if (!state || !state.cameraInstalled) {
          feedLayer.innerHTML = "<div class='cctv-no-signal'>" +
            "<div class='cctv-noise-screen'></div>" +
            "<div class='cctv-signal-box'>" +
            "<h3>⚠️ 无信号 / NO SIGNAL</h3>" +
            "<p>未检测到摄像头硬件。请先在【淘宝网购】购买微型摄像头并在浴室进行安装。</p>" +
            "</div></div>";
        } else {
          var isBathing = state.wanqing.currentState === "Bathing";
          if (isBathing) {
            feedLayer.innerHTML = "<div class='cctv-live-box'>" +
              "<img class='cctv-live-img' src='assets/char/wanqing/n_c1.png' alt='洗澡监控' />" +
              "<div class='cctv-live-overlay'>" +
              "<p class='cctv-live-desc'>【LIVE 1080P】浴室水汽氤氲，林晚晴正在花洒下冲洗着柔嫩的肌肤……</p>" +
              "<button type='button' id='btn-cctv-peek-act' class='btn btn--primary'>🔍 放大焦距特写观赏 (欲望 +8)</button>" +
              "</div></div>";
            
            var peekBtn = feedLayer.querySelector("#btn-cctv-peek-act");
            if (peekBtn) {
              peekBtn.onclick = function () {
                state.wanqing.lust = clamp(state.wanqing.lust + 8, 0, 100);
                ensureStats(state);
                state.wanqing.stats.hand = (state.wanqing.stats.hand || 0) + 1;
                persist();
                renderNpcPanel();
                popHeart(0, 8);
                peekBtn.textContent = "已特写观赏！欲望大幅增长！";
                peekBtn.disabled = true;
              };
            }
          } else {
            feedLayer.innerHTML = "<div class='cctv-live-box'>" +
              "<img class='cctv-live-img' src='assets/bg/bath.webp' alt='浴室空场' />" +
              "<div class='cctv-live-overlay'>" +
              "<p class='cctv-live-desc'>【LIVE 1080P】浴室当前无人使用，通风扇与镜面安安静静。</p>" +
              "</div></div>";
          }
        }
      } else if (currentCam === "cam02") {
        if (camTag) camTag.textContent = "CAM-02 客厅 Living Room";
        feedLayer.innerHTML = "<div class='cctv-live-box'>" +
          "<img class='cctv-live-img' src='assets/bg/living_day.webp' alt='客厅监控' />" +
          "<div class='cctv-live-overlay'>" +
          "<p class='cctv-live-desc'>【LIVE 1080P】客厅实时监控。光线柔和，沙发上放着抱枕。</p>" +
          "</div></div>";
      } else if (currentCam === "cam03") {
        if (camTag) camTag.textContent = "CAM-03 卧室 Bedroom";
        feedLayer.innerHTML = "<div class='cctv-live-box'>" +
          "<img class='cctv-live-img' src='assets/bg/her_room_day.webp' alt='卧室监控' />" +
          "<div class='cctv-live-overlay'>" +
          "<p class='cctv-live-desc'>【LIVE 1080P】主卧门掩着，弥漫着淡淡的柑橘清香。</p>" +
          "</div></div>";
      }
    }

    renderFeed();
  }

  function openIpadModal() {
    var modal = document.getElementById("ipad-modal");
    var homeBar = document.getElementById("ipad-home-bar");
    var ipadTime = document.getElementById("ipad-time");
    if (!modal) return;

    modal.classList.remove("hidden");

    if (ipadTime) {
      var d = new Date();
      var pad = function (n) { return n < 10 ? "0" + n : n; };
      ipadTime.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + " 周" + DOW_CN[dow(state || { dayCount: 1 })];
    }

    var views = {
      home: document.getElementById("ipad-home-screen"),
      wechat: document.getElementById("ipad-wechat-view"),
      weibo: document.getElementById("ipad-weibo-view"),
      notes: document.getElementById("ipad-notes-view"),
      stats: document.getElementById("ipad-stats-view")
    };

    function showView(name) {
      Object.keys(views).forEach(function (k) {
        if (views[k]) views[k].classList.add("hidden");
      });
      if (views[name]) views[name].classList.remove("hidden");
    }

    showView("home");

    var appWechat = document.getElementById("ipad-app-wechat");
    var appWeibo = document.getElementById("ipad-app-weibo");
    var appTb = document.getElementById("ipad-app-tb");
    var appCctv = document.getElementById("ipad-app-cctv");
    var appPhotos = document.getElementById("ipad-app-photos");
    var appNotes = document.getElementById("ipad-app-notes");
    var appStats = document.getElementById("ipad-app-stats");

    if (appWechat) {
      appWechat.onclick = function () {
        showView("wechat");
        renderWeChat();
      };
    }
    if (appWeibo) {
      appWeibo.onclick = function () {
        showView("weibo");
        renderWeibo();
      };
    }
    if (appTb) {
      appTb.onclick = function () {
        modal.classList.add("hidden");
        openTaobaoModal();
      };
    }
    if (appCctv) {
      appCctv.onclick = function () {
        modal.classList.add("hidden");
        openCctvModal();
      };
    }
    if (appPhotos) {
      appPhotos.onclick = function () {
        modal.classList.add("hidden");
        openGallery("all");
      };
    }
    if (appNotes) {
      appNotes.onclick = function () {
        showView("notes");
        renderNotes();
      };
    }
    if (appStats) {
      appStats.onclick = function () {
        showView("stats");
        renderStats();
      };
    }

    var wcBack = document.getElementById("wechat-back-btn");
    var wbBack = document.getElementById("weibo-back-btn");
    var ntBack = document.getElementById("notes-back-btn");
    var stBack = document.getElementById("stats-back-btn");

    if (wcBack) wcBack.onclick = function () { showView("home"); };
    if (wbBack) wbBack.onclick = function () { showView("home"); };
    if (ntBack) ntBack.onclick = function () { showView("home"); };
    if (stBack) stBack.onclick = function () { showView("home"); };

    if (homeBar) {
      homeBar.onclick = function () {
        if (!views.home.classList.contains("hidden")) {
          modal.classList.add("hidden");
        } else {
          showView("home");
        }
      };
    }

    var tabChat = document.getElementById("wc-tab-chat");
    var tabMoments = document.getElementById("wc-tab-moments");
    var bodyChat = document.getElementById("wc-body-chat");
    var bodyMoments = document.getElementById("wc-body-moments");

    if (tabChat && tabMoments) {
      tabChat.onclick = function () {
        tabChat.classList.add("is-active");
        tabMoments.classList.remove("is-active");
        if (bodyChat) bodyChat.classList.remove("hidden");
        if (bodyMoments) bodyMoments.classList.add("hidden");
      };
      tabMoments.onclick = function () {
        tabMoments.classList.add("is-active");
        tabChat.classList.remove("is-active");
        if (bodyMoments) bodyMoments.classList.remove("hidden");
        if (bodyChat) bodyChat.classList.add("hidden");
        renderMoments();
      };
    }

    function renderWeChat() {
      var log = document.getElementById("wc-chat-log");
      var input = document.getElementById("wc-input");
      var sendBtn = document.getElementById("wc-send-btn");
      if (!log) return;

      var messages = [
        { sender: "wanqing", time: "12:30", text: "小陈，钥匙收好了吗？阳台衣服我帮你看过了，今天天气挺好的。" },
        { sender: "player", time: "12:32", text: "收好了，谢谢晚晴姐！做家务辛苦啦。" }
      ];

      if (state && state.wanqing.trust >= 30) {
        messages.push({ sender: "wanqing", time: "18:15", text: "下班买了解暑的西瓜，冰在冰箱里了，晚上你记得拿出来切着吃哦。" });
      }
      if (state && state.wanqing.trust >= 60) {
        messages.push({ sender: "wanqing", time: "22:04", text: "最近不知道怎么回事……只要屋里没声音，我就总想着你在次卧干嘛呢。" });
      }

      function drawLog() {
        log.innerHTML = "";
        messages.forEach(function (m) {
          var item = document.createElement("div");
          item.className = "wc-chat-msg " + (m.sender === "player" ? "is-player" : "is-wanqing");
          item.innerHTML = "<div class='wc-msg-bubble'>" + m.text + "</div><div class='wc-msg-time'>" + m.time + "</div>";
          log.appendChild(item);
        });
        log.scrollTop = log.scrollHeight;
      }

      drawLog();

      if (sendBtn && input) {
        sendBtn.onclick = function () {
          var val = input.value.trim();
          if (!val) return;
          var now = new Date();
          var pad = function(n) { return n < 10 ? "0" + n : n; };
          var tStr = pad(now.getHours()) + ":" + pad(now.getMinutes());

          messages.push({ sender: "player", time: tStr, text: val });
          input.value = "";
          drawLog();

          window.setTimeout(function () {
            var reply = "“收到啦！等下忙完了我就过去找你~”";
            if (state && state.wanqing.trust >= 70) reply = "“你这嘴可真甜……想我了就直接来找我嘛，何必在微信上绕弯子呢。”";
            messages.push({ sender: "wanqing", time: tStr, text: reply });
            drawLog();
          }, 1000);
        };
      }
    }

    function renderMoments() {
      var feed = document.getElementById("wc-moments-feed");
      if (!feed) return;
      feed.innerHTML = "";

      var posts = [
        {
          id: 1,
          time: "2小时前",
          content: "终于把次卧整理好租出去了，遇到个挺有礼貌的小陈同学。客厅又亮起了温暖的小夜灯，感觉真好。🌸",
          img: "assets/bg/living_day.webp",
          likes: 5
        },
        {
          id: 2,
          time: "昨天 21:40",
          content: "商场发的新款柑橘香水小样，味道甜而不腻。不知道有没有人会喜欢这种成熟的芬芳呢？",
          img: "assets/char/wanqing/s2.png",
          likes: 8
        }
      ];

      posts.forEach(function (p) {
        var card = document.createElement("div");
        card.className = "wc-moment-card";
        card.innerHTML = "<div class='wc-moment-head'>" +
          "<img src='assets/char/wanqing/s1.png' class='wc-avatar' alt='' />" +
          "<div><div class='wc-moment-author'>林晚晴</div><div class='wc-moment-time'>" + p.time + "</div></div>" +
          "</div>" +
          "<div class='wc-moment-body'>" + p.content + "</div>" +
          "<img class='wc-moment-img' src='" + p.img + "' alt='' />" +
          "<div class='wc-moment-foot'>" +
          "<button type='button' class='wc-like-btn'>❤️ 点赞 (<span class='like-cnt'>" + p.likes + "</span>)</button>" +
          "</div>";

        var likeBtn = card.querySelector(".wc-like-btn");
        var cntEl = card.querySelector(".like-cnt");
        if (likeBtn) {
          likeBtn.onclick = function () {
            p.likes += 1;
            if (cntEl) cntEl.textContent = p.likes;
            if (state) {
              state.wanqing.trust = clamp(state.wanqing.trust + 1, 0, 100);
              persist();
              popHeart(1, 0);
            }
            likeBtn.disabled = true;
          };
        }

        feed.appendChild(card);
      });
    }

    function renderWeibo() {
      var body = document.getElementById("weibo-body");
      if (!body) return;
      body.innerHTML = "<div class='weibo-post-card'>" +
        "<div class='weibo-user-row'><img src='assets/char/wanqing/s3.png' class='wc-avatar' /><b>@晚晴的晴天日记</b> <span class='weibo-v'>V</span></div>" +
        "<p>夏天的风总是带着一丝燥热，晚饭后在客厅阳台上吹吹风，听着窗外的鸣蝉，心慢慢静了下来。希望明天也是好天气。☀</p>" +
        "<div class='weibo-stats'>转发 12 · 评论 45 · 点赞 128</div>" +
        "</div>";
    }

    function renderNotes() {
      var body = document.getElementById("notes-body");
      if (!body) return;
      var q = getCurrentQuest(state);
      body.innerHTML = "<div class='notes-card'>" +
        "<h3>📝 租客观察与攻略日记</h3>" +
        "<p><b>当前主线阶段：</b> " + q.title + "</p>" +
        "<p><b>核心推进目标：</b> " + q.target + "</p>" +
        "<hr />" +
        "<p><b>晚晴姐的个人喜好：</b></p>" +
        "<ul>" +
        "<li>喜爱的礼物：法国柑橘香水、冰镇甜白葡萄酒、黑巧克力</li>" +
        "<li>喜爱的家务：厨房搭把手切菜、阳台晾晒棉麻被套</li>" +
        "<li>情感转折点：信赖达到 30、60、91 时触发质变自触发剧情</li>" +
        "</ul>" +
        "</div>";
    }

    function renderStats() {
      IntimacyStatsManager.refreshUI();
    }
  }

  function bootAfterMoveIn() {
    setGameClass("is-vn", false);
    setGameClass("is-slg", true);
    state = defaultState();
    applySchedule(state, "boot");
    playLines(
      [
        { speaker: "narration", text: "（合租生活正式开始。钥匙静静躺在口袋里，带着崭新的期盼。）" },
        { speaker: "narration", text: "（从现在开始，时光开始流动。去各房间探索，或者去找找晚晴吧。）" }
      ],
      enterMap
    );
  }

  function continueFromSave() {
    var s = readSave();
    if (!s) return false;
    state = s;
    if (!state.wanqing) return false;
    setGameClass("is-vn", false);
    setGameClass("is-slg", true);
    enterMap();
    return true;
  }

  function hideActionsPanel() {
    if (isNpcPanelRevealed) {
      isNpcPanelRevealed = false;
      renderNpcPanel();
    }
  }

  global.Slg = {
    bind: bind,
    loadTables: loadTables,
    bootAfterMoveIn: bootAfterMoveIn,
    continueFromSave: continueFromSave,
    hasSave: hasSave,
    openGallery: openGallery,
    playVideoEvent: playVideoEvent,
    playStage: playStage,
    StoryStateManager: StoryStateManager,
    IntimacyStatsManager: IntimacyStatsManager,
    InteractionManager: InteractionManager,
    TimeTransitionController: TimeTransitionController,
    processTimeSlot: processTimeSlot,
    openSheet: openSheet,
    openTaobaoModal: openTaobaoModal,
    openCctvModal: openCctvModal,
    openIpadModal: openIpadModal,
    openMinigameModal: openMinigameModal,
    triggerTimeTransition: triggerTimeTransition,
    onCharClick: onCharClick,
    hideActionsPanel: hideActionsPanel,
    execAction: function (actionId, arg) {
      if (mode !== "map") return;
      var lines = execAction(state, actionId, arg);
      playLines(lines, enterMap);
    },
    getState: function () {
      return state;
    }
  };
})(window);
