contract NameFilter:
    def filter(name: string[100]) -> bool: constant


nameFilter:public(NameFilter)

@public
def __init__(_filter:address):
    self.nameFilter = NameFilter(_filter)

@public
@constant
def checkName(name: string[100]) -> bool:
    return self.nameFilter.filter(name)
