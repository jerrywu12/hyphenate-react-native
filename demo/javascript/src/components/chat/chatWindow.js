var React = require("react");
var SendWrapper = require('./sendwrapper');
var Notify = require('../common/notify');
var Avatar = require('../common/avatar');
var Operations = require('./operations');

module.exports = React.createClass({
    getInitialState: function () {
        return {
            admin: 0,
            owner: [],
            members: [],
            memberShowStatus: false
        };
    },

    getGroupOwner: function (cb_type) {
        //only group window
        if (this.props.winType == 'group') {
            var me = this;
            if (WebIM.config.isWindowSDK) {
                WebIM.doQuery('{"type":"groupOwner","id":"' + me.props.roomId + '"}',
                    function success(str) {
                        var owner = [{jid: str, affiliation: "owner"}];
                        var admin = 0;
                        if (str == Demo.user) {
                            admin = 1;
                        }
                        me.setState({admin: admin, owner: owner});
                        if (cb_type == 'listMember') {
                            me.listMember();
                        } else {
                            me.refs['operation_div'].refs['switch'].click();
                        }
                    },
                    function failure(errCode, errMessage) {
                        Notify.error("queryRoomInfo:" + errCode);
                    });
            } else {
                Demo.conn.queryRoomInfo({
                    roomId: me.props.roomId,
                    success: function (members) {
                        if (members && members.length > 0) {
                            var jid = members[0].jid;
                            var username = jid.substring(jid.indexOf('_') + 1).split('@')[0];
                            var admin = 0;
                            if (members[0].affiliation == 'owner' && username == Demo.user) {
                                admin = 1;
                            }
                            me.setState({admin: admin, owner: members});
                            if (cb_type == 'listMember') {
                                me.listMember();
                            } else if (cb_type == 'opertion') {
                                me.refs['operation_div'].refs['switch'].click();
                            }
                        }
                    },
                    error: function () {
                        Notify.error('queryRoomInfo error', me.props.roomId);
                    }
                });
            }
        }
    },

    componentWillReceiveProps: function (nextProps) {

    },

    preListMember: function () {
        if (this.state.owner.length == 0) {
            this.getGroupOwner('listMember');
        } else {
            this.listMember();
        }
    },
    listMember: function () {
        if (this.refs.i.className.indexOf('up') < 0) {
            var me = this;
            if (WebIM.config.isWindowSDK) {
                WebIM.doQuery('{"type":"groupMembers","id":"' + me.props.roomId + '"}',
                    function success(str) {
                        var members = eval('(' + str + ')');
                        if (members && members.length > 0) {
                            me.refreshMemberList(members);
                        } else {
                            //trigger adding owner to members
                            me.refreshMemberList([]);
                        }
                    },
                    function failure(errCode, errMessage) {
                        Notify.error("listMember:" + errCode);
                    });
            } else {
                Demo.conn.queryRoomMember({
                    roomId: me.props.roomId,
                    success: function (members) {
                        if (members && members.length > 0) {
                            me.refreshMemberList(members);
                        } else {
                            //trigger adding owner to members
                            me.refreshMemberList([]);
                        }
                    },
                    error: function () {
                    }
                });
            }
        } else {
            this.refs.i.className = 'webim-down-icon font smallest dib';
            this.setState({members: [], memberShowStatus: false});
        }
    },

    refreshMemberList: function (members) {
        this.refs.i.className = 'webim-down-icon font smallest dib webim-up-icon';
        this.setState({members: this.state.owner.concat(members), memberShowStatus: true});
    },
    send: function (msg) {
        Demo.conn.send(msg);
        Demo.api.appendMsg(msg, 'txt');
    },

    render: function () {
        var className = this.props.roomId ? ' dib' : ' hide',
            props = {
                sendPicture: this.props.sendPicture,
                sendAudio: this.props.sendAudio,
                sendFile: this.props.sendFile
            },
            memberStatus = this.state.memberShowStatus ? '' : ' hide',
            roomMember = [];


        for (var i = 0, l = this.state.members.length; i < l; i++) {
            var jid = this.state.members[i].jid,
                username = jid.substring(jid.indexOf('_') + 1).split('@')[0];

            roomMember.push(<li key={i}>
                <Avatar src='demo/images/default.png'/>
                <span>{username}</span>
            </li>);
        }


        return (
            <div className={'webim-chatwindow ' + this.props.className}>
                <div className='webim-chatwindow-title'>
                    {this.props.name}
                    <i ref='i' className={'webim-down-icon font smallest' + className}
                       onClick={this.preListMember}>D</i>
                </div>
                <div className={this.props.showOptions ? '' : 'hide'}>
                    <Operations ref='operation_div' roomId={this.props.roomId} admin={this.state.admin}
                                owner={this.state.owner}
                                getGroupOwner={this.getGroupOwner}/>
                </div>
                <ul ref='member' className={'webim-group-memeber' + memberStatus}>{roomMember}</ul>
                <div id={this.props.id} ref='wrapper' className='webim-chatwindow-msg'></div>
                <SendWrapper send={this.send} {...props} />
            </div>
        );
    }
});
