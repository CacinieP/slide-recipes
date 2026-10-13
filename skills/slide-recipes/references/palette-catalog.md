# Semantic palette catalog / 语义配色目录

20 original presets. All pass the runtime text-pair checks at 4.5:1. Color names are design directions, not claims of trend research.

```js
const recipe = createCommercialRecipe(pres, "editorial-proposal", {
  palette: "aubergine-lime", fontFace: "Your installed font"
});
```

| Preset | paper | ink | muted | accent | highlight | line | dark | light |
|---|---|---|---|---|---|---|---|---|
| navy-teal | `F5F8FA` | `142B40` | `526475` | `006F73` | `BCE9E5` | `CCD8E0` | `142B40` | `F5F8FA` |
| forest-sand | `F5F1E8` | `123936` | `52635B` | `28664D` | `D8F0A3` | `C6CDC2` | `123936` | `F5F1E8` |
| cobalt-white | `FAF9F6` | `242629` | `5E6268` | `214CC4` | `DDE7FF` | `D5D8DD` | `183387` | `FAF9F6` |
| burgundy-cream | `FBF6EE` | `35252B` | `725660` | `8C2946` | `F0CDD5` | `DFCFD2` | `4B1F2D` | `FBF6EE` |
| graphite-orange | `FAF8F4` | `25282C` | `62605B` | `A94413` | `FFDFC6` | `D8D4CB` | `25282C` | `FAF8F4` |
| aubergine-lime | `F8F4F7` | `312137` | `705A70` | `69336F` | `DDEDAB` | `DED1DF` | `312137` | `F8F4F7` |
| petrol-apricot | `F6F5EF` | `163D44` | `4C666A` | `176272` | `FFD3B0` | `C9D8D8` | `163D44` | `F6F5EF` |
| ink-lilac | `F6F5FA` | `252A4B` | `5F627B` | `494F8C` | `DCD2F4` | `D7D6E5` | `252A4B` | `F6F5FA` |
| plum-celadon | `F8F5F1` | `432B3A` | `705B69` | `783E60` | `CEE4D8` | `DDCFD6` | `432B3A` | `F8F5F1` |
| indigo-saffron | `F8F7F0` | `252E4D` | `5E6577` | `354D92` | `F5DA91` | `D4D8E0` | `252E4D` | `F8F7F0` |
| oxblood-rose | `FAF4F3` | `48262D` | `76565E` | `8A3246` | `F2CFCC` | `E1CDD0` | `48262D` | `FAF4F3` |
| moss-linen | `F5F3E9` | `303A2C` | `606856` | `4B653A` | `E2E4B9` | `D4D7C6` | `303A2C` | `F5F3E9` |
| espresso-ice | `F8F5F0` | `3D2D28` | `746058` | `78503C` | `CBE5EB` | `DFD3CB` | `3D2D28` | `F8F5F0` |
| terracotta-glacier | `FAF5EF` | `493129` | `786054` | `984B32` | `CEE5E7` | `E2D4C9` | `493129` | `FAF5EF` |
| midnight-citron | `F6F7F1` | `232E39` | `5A6570` | `385E72` | `E4EFAD` | `D3DDDB` | `232E39` | `F6F7F1` |
| mineral-copper | `F4F7F5` | `263F3C` | `556C66` | `397166` | `F0CEB5` | `CCDBD5` | `263F3C` | `F4F7F5` |
| slate-wisteria | `F7F5F9` | `343444` | `696276` | `655080` | `E1D4ED` | `DAD3E2` | `343444` | `F7F5F9` |
| olive-orchid | `F8F6EF` | `3C3C28` | `6A6752` | `68612F` | `E8D6EA` | `DBD8C5` | `3C3C28` | `F8F6EF` |
| prussian-butter | `F8F6EE` | `193B50` | `556773` | `245B79` | `F4E5B8` | `D1DADE` | `193B50` | `F8F6EE` |
| mulberry-mist | `F8F4F6` | `452E43` | `745F70` | `803E73` | `D2E4E5` | `DECFDA` | `452E43` | `F8F4F6` |
| nordic-sage | `F4F6F0` | `233228` | `54695B` | `2E5E43` | `CDE4D4` | `CCD6CC` | `1B2920` | `F4F6F0` |
| consulting-navy | `F8F9FA` | `111E2E` | `4B5B6D` | `0B4F8A` | `D0E4F7` | `CFD9E3` | `111E2E` | `F8F9FA` |
| tokyo-cherry | `F9F8F6` | `2B2326` | `6B575D` | `B82645` | `FBD2DB` | `DDD2D5` | `2B1F23` | `F9F8F6` |
| desert-dune | `F8F5EE` | `382A20` | `6B5748` | `8C4724` | `F5D5C2` | `DBD1C3` | `33241A` | `F8F5EE` |
| electric-violet | `F7F6FB` | `221D38` | `595078` | `5C32A8` | `E2D4FD` | `D7D0EB` | `221D38` | `F7F6FB` |
| alpine-cyan | `F6F9FA` | `1A2C38` | `536573` | `1B6B8A` | `CDE7F2` | `D0DDE5` | `162630` | `F6F9FA` |
| bamboo-teal | `F5F8F6` | `1D3328` | `50695B` | `1C6E4A` | `C6E8D6` | `CCD9D1` | `162A20` | `F5F8F6` |
| amber-coal | `FAF8F4` | `282725` | `6B665E` | `9E5D10` | `FCE5C3` | `DCD5CA` | `26231E` | `FAF8F4` |

Use paper for light backgrounds, ink/muted/accent for text on paper, light on dark/ink/accent, and highlight on dark. line is decorative. Never assume other pairs are readable. Use labels and shapes alongside colors for categories/status. Image backgrounds require visual review.

提示词：使用 [预设 ID] 为 [主题] 生成配色；保留 8 个语义角色，以浅底为主、深底为章节页；highlight 只用于深底强调或装饰。先比较同一页，再推广全稿。自定义颜色必须经过 resolveBusinessPalette 校验。
