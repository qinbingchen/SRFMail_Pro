# SRFMail_Pro

----

###对于数据库设计中`session`的解释

根据需求，为解决以下几个问题：

1. 一封邮件同时可以由多个人回复，多个人查看
2. 邮件被分发后可以被退回
3. 回复邮件可以被退回

引入`会话`的概念，既将单个员工从接收到邮件到完成回复邮件的过程看做一次会话。

系统在接收到邮件时建立一个会话，如果分发人员将邮件分发给多个员工处理，此时系统会将会话复制为多个，并与不同处理人员关联，每个人负责完成各自的会话，从而简化对系统状态的控制。

每个会话会记录对于改会话的每一个操作，并提供对历史记录的查询。

###各个依赖的module的用处

####当前全部的依赖模块

1. redis
2. mongoose
3. socket.io
4. node-mailer
5. mail-listener2
6. hiredis
7. express

####各个模块的作用

#####redis

计划利用redis做发送队列

#####mongoose

mongodb连接工具

#####socket.io

利用websocket实现的实时通信工具，计划用其进行前端与后台的实时通信，当后台接受到新邮件时即时通知前端。

#####node-mailer

发送邮件工具

#####mail-listener2

imap协议下得邮件接收及监听工具

#####hiredis

redis模块的本地代码绑定

#####express

http部分处理框架