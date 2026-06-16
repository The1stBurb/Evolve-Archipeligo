from random import randint
pas=0
n=1000
a=500
b=999
for i in range(n):
    if randint(0,a)>=randint(0,b):
        pas+=1
print(pas,"/",n,"\n",2*a-b+1,"/",2*a,"\n",2*a-b,"/",2*a)
m=min(a,b)
print((m+1)*(a+1)-(m*(m+1))/2,"/",(a+1)*(b+1)," -> ",((m+1)*(a+1)-(m*(m+1))/2)/((a+1)*(b+1)))