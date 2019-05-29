Sol
=====
Sol abstracts away the basic work nearly every backend requires. Using
express is always just the beginning; its mainly a router and much more
work is required to create an actual backend.

Sol provides glue code that makes it easier and faster to create backends
for web applications. It can also be used as a decoupled CMS to power a website - its up to the developer.

## The main principles

### Declaration files
At the very core reside declarations about how the backend should look like.
Based on those declarations, the data store will be bootstrapped and procedures
for CRUD operations will be generated. The developer has the possibility to
manually override those automatic actions partly, as well as completely.

### Data store
There are plenty of possibilities to store data. Sol can hook into any data
store from plain files on your HDD over MySQL to redis and others. The developer
can define wrapper modules that handle initialization, teardown and data 
manipulation for those stores. The modules will be the gatekeepers between
the actual store and the procedures, since they will be forwarded into procedures.

### Procedures
This is the part with the "business logic". A procedure will gain access to the
data store(s) and the declarations as well as the current user that issued
the procedure call alongside the call arguments.

### Connectors
Connectors - well - connect the procedures with the "outside world" through
various transport media. There may be a connector for a REST endpoint, or
one for websocket communication. The connectors manage the user sessions, 
call procedures based on incoming requests and return data provided by the
procedures through their transport medium.

### Access control
To control which users can access or modify data, a set of rights can be defined. Rights are set on groups which in turn can be assigndd to users. Sol will pass the currently owned rights alongside the user data into the procedures.
