var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


var dataType = {
    common: {
        INIT: "init",
        INIT_SPACE: "init_space",
    },
    types: {
        ARRAY: {
            ADD: "array_add"
        }
    }
}

var dataUser = {
    common: {
        CLIENT: "client",
        SERVER: "server"
    }
}

var getJsPath = function (root, path) {
    return eval("root"+path);
}

var getLeastVer = function (dataRespo) {
    return dataRespo.length-1;
}
var getChanges = function (dataRespo, dataPath, fromVer, toVer) {
    var curVer = fromVer+1;

    var changes = [];
    var type = getJsPath(dataRespo[0], dataPath).type;
    for (let i = curVer; i <= toVer; i++) {
        var data = getJsPath(dataRespo[i], dataPath);
        changes = changes.concat(data.changes);
    }
    return {
        type: type,
        changes: changes
    };
}

var syncNode = {
    dataGit: {
        dataShape: {
            messages: []
        },
        dataRespo: [
            {
                messages: {
                    type: dataType.types.ARRAY,
                    changes: [
                        {
                            type: dataType.common.INIT_SPACE,
                        }
                    ]
                }
            },
            {
                messages: {
                    type: dataType.types.ARRAY,
                    changes: [
                        {
                            type: dataType.types.ARRAY.ADD,
                            source: dataUser.common.SERVER,
                            info: "id1: 我来了"
                        }
                    ]
                }
            },
            {
                messages: {
                    type: dataType.types.ARRAY,
                    changes: [
                        {
                            type: dataType.types.ARRAY.ADD,
                            source: dataUser.common.SERVER,
                            info: "id2: 我来了"
                        }
                    ]
                }
            }
        ],
    },
    logicMng: {
        //遍历同步所有逻辑体
        syncToLogics: function () {
            var currentVer = getLeastVer(syncNode.dataGit.dataRespo);
            var logics = syncNode.logicMng.logics;
            for (const logicsKey in syncNode.logicMng.logics) {
                var logic = logics[logicsKey];
                logic.syncAction(currentVer);
            }
        },
        logics: {
            messageMng: {
                dataGitVer: 2,
                syncAction: function (toVer) {
                    var changesInfo = getChanges(syncNode.dataGit.dataRespo, ".messages", this.dataGitVer, toVer);
                    var type = changesInfo.type;
                    var allNewMessages = [];
                    changesInfo.changes.forEach(change=>{
                        //检查更改内容
                        var changeType = change.type;
                        var changeInfo = change.info;
                        if(changeType === dataType.types.ARRAY.ADD) {
                            allNewMessages.push(changeInfo);
                        }
                    });
                    var messagesData = getJsPath(syncNode.dataGit.dataShape, ".messages");

                    //更新当前数据
                    messagesData.concat(allNewMessages);
                    //更新逻辑认定数据git版本号
                    this.dataGitVer = getLeastVer(syncNode.dataGit.dataRespo);
                    //同步数据git
                    io.emit("sync", syncNode.dataGit);
                }
            }
        }
    }
}

var assertChange = function (changeFunc) {
    changeFunc();
    syncNode.logicMng.syncToLogics();
}
io.on('connection', function(socket){
    //日志记录
    console.log('a user connected');

    //向用户传递全局数据
    io.emit("init", syncNode.dataGit);

    //通知其他人，这个人来了
    assertChange(function (){
        var respo = syncNode.dataGit.dataRespo;
        respo.push({
            //想数据git推送数据改动项，类似github一样
            messages: {
                type: dataType.types.ARRAY,
                changes: [
                    {
                        type: dataType.types.ARRAY.ADD,
                        source: dataUser.common.SERVER,
                        info: socket.id+": "+"hi"
                    }
                ]
            }
        });
    });

    //设置此用户发送消息处理
    socket.on('sync', function(dataGit){
        assertChange(function (){
            syncNode.dataGit = dataGit;
        });
    });

    //设置此用户断开连接处理
    socket.on('disconnect', function(){
        assertChange(function (){
            var respo = syncNode.dataGit.dataRespo;
            respo.push({
                //想数据git推送数据改动项，类似github一样
                messages: {
                    type: dataType.types.ARRAY,
                    changes: [
                        {
                            type: dataType.types.ARRAY.ADD,
                            source: dataUser.common.SERVER,
                            info:  socket.id+": "+"我走了"
                        }
                    ]
                }
            });
        });
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
