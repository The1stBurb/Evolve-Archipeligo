from conditions import imps
for j in ["demonic","carnivore","herbivore","fungi","synthetic","eldritch","all_the_othes"]:
	correct=[]
	wrong=[]
	for i in imps:
		if i.evaluate(j):
			correct.append(i.locs)
		else:
			wrong.append(i.locs)
	print(f"{j} has not {wrong}")