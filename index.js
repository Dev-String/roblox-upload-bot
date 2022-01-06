const { Client, Intents, MessageEmbed } = require('discord.js');
const noblox = require("noblox.js");
const cheerio = require('cheerio');
const rassets = require("rassets")
const axios = require('axios');
const fs = require('fs');
const config = require("./config.json");

const channel = config.upload_channel;
const name = config.game_name;
const desc = config.game_description;

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

function removeFirstLineOfFile(filePath) {
    let data = fs.readFileSync(filePath, 'utf8');
    data = data.substr(data.indexOf('\n') + 1);
    fs.writeFileSync(filePath, data, 'utf8');
}

function getFirstLineOfFile(filePath) {
    let data = fs.readFileSync(filePath, 'utf8');
    return data.substr(0, data.indexOf('\n'));
}

function getRandomFile(dir) {
    const files = fs.readdirSync(dir)
    const file = files[Math.floor(Math.random() * files.length)]
    return dir + file
}

async function upload() {
    client.channels.cache.get(channel).bulkDelete(100);
    setTimeout(function() {
        const embed = new MessageEmbed()
        .setTitle("Uploading...")
        .setColor("#8c03fc")
        client.channels.cache.get(channel).send({embeds: [ embed ]}).then(async msg => {
          const confile = getRandomFile("games/")
  
          const cookie = getFirstLineOfFile("cookies.txt").replace("\n", "").replace("\r", "")
  
          removeFirstLineOfFile("cookies.txt")
  
          noblox.setCookie(cookie).then(user => {
            axios({
              method: "get",
              url: "https://www.roblox.com/users/inventory/list-json?assetTypeId=9&cursor=&itemsPerPage=100&pageNumber=1&placeTab=Created&userId=" + user.UserID,
            }).then(info => {
  
              const placeid = info.data.Data.Items[0].Item.AssetId
  
              rassets.upload(cookie, {
                file: fs.createReadStream(confile),
                assetType: "Place",
                name: name,
                assetid: placeid,
                description: desc,
                ispublic: true,
              }).then(() => {
                const preparing = new MessageEmbed()
                .setTitle("Preparing...")
                .setColor("#8c03fc")
                msg.edit({embeds: [ preparing ]})
  
                axios({
                  method: "get",
                  url: "https://api.roblox.com/universes/get-universe-containing-place?placeid=" + placeid,
                }).then(re => {
                  noblox.updateUniverseAccess(re.data.UniverseId, true)
                  noblox.getGeneralToken().then(token => {
                    axios({
                      method: "patch",
                      url: `https://develop.roblox.com/v2/universes/${re.data.UniverseId}/configuration`,
                      headers: {
                        "x-csrf-token": token,
                        "content-type": "application/json",
                        "cookie": ".ROBLOSECURITY=" + cookie,
                      },
                      data: {
                        allowPrivateServers: true,
                        privateServerPrice: 0,
                        name: name,
                        description: desc,
                        universeAvatarType: "MorphToR6",
                        universeAnimationType: "Standard",
                        universeCollisionType: "InnerBox",
                        universeJointPositioningType: "Standard",
                        isArchived: false,
                        isFriendsOnly: false,
                        genre: "All",
                        isForSale: false,
                        price: 0,
                        studioAccessToApisAllowed: true,
                        permissions: {
                          isThirdPartyTeleportAllowed: true,
                          IsThirdPartyAssetAllowed: true,
                          IsThirdPartyPurchaseAllowed: true,
                        }
                      }
                    }).catch(err => {
                      axios({
                        method: "patch",
                        url: `https://develop.roblox.com/v2/universes/${re.data.UniverseId}/configuration`,
                        headers: {
                          "x-csrf-token": token,
                          "content-type": "application/json",
                          "cookie": ".ROBLOSECURITY=" + cookie,
                        },
                        data: {
                          allowPrivateServers: true,
                          privateServerPrice: 0,
                          name: name,
                          description: desc,
                          universeAvatarType: "MorphToR6",
                          universeAnimationType: "Standard",
                          universeCollisionType: "InnerBox",
                          universeJointPositioningType: "Standard",
                          isArchived: false,
                          isFriendsOnly: false,
                          genre: "All",
                          isForSale: false,
                          price: 0,
                          studioAccessToApisAllowed: true,
                          permissions: {
                            isThirdPartyTeleportAllowed: true,
                            IsThirdPartyAssetAllowed: true,
                            IsThirdPartyPurchaseAllowed: true,
                          }
                        }
                      }).catch(err => { })
                    })
                    axios({
                      method: "patch",
                      url: `https://develop.roblox.com/v2/places/${placeid}`,
                      headers: {
                        "x-csrf-token": token,
                        "content-type": "application/json",
                        "cookie": ".ROBLOSECURITY=" + cookie,
                      },
                      data: {
                        name: name,
                        description: desc,
                        maxPlayerCount: config.player_count
                      }
                    }).catch(err => { console.log(err) })
  
                    setTimeout(function() {
                      noblox.getPlaceInfo(placeid).then(info => {
                        if (info.IsPlayable.toString() == "true") {
                          const ready = new MessageEmbed()
                          .setTitle(`https://www.roblox.com/games/${placeid}/-`)
                          .setColor("#8c03fc")
                          msg.edit({embeds: [ ready ]})
  
                          var startNew = false
  
                          setInterval(function() {
                            try {
                              noblox.getPlaceInfo(placeid).then(info2 => {
                                if (info2.IsPlayable.toString() == "false" || info2.Name == "[ Content Deleted ]" && startNew == false) {
                                  startNew = true
                                  upload()
                                  clearInterval(this)
                                }
                              }).catch(err => {
                                if (startNew == false) {
                                  startNew = true
                                  upload()
                                  clearInterval(this)
                                }
                              })
                            } catch {
  
                            }
                          }, 5000)
                        } else {
                          upload()
                        }
                      })
                    }, 500)
                  })
                })
              }).catch(err => {
                console.log("Failed to upload. Possibly corrupted file")
              })
  
            }).catch(err => {
              upload()
            })
          }).catch(err => {
            upload()
          })
        })
      }, 2000)
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

setTimeout(function() {
  upload()
}, 2000)

client.login(config.bot_token);
